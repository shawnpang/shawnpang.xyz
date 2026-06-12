/*
 * Regenerates public/yc-fintech-wave-map/map-geo.js — the projected world
 * landmass behind the Location view's map.
 *
 *   node scripts/build-map-geo.mjs [land-topojson-path]
 *
 * With no argument it downloads world-atlas land-50m.json (Natural Earth data,
 * public domain) from jsdelivr. The output stores SVG path data already in
 * viewBox pixels plus the projection constants (k, cx, cy) app.js needs to
 * plot city coordinates with the same Natural Earth projection.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SOURCE_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-50m.json";
const OUT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "yc-fintech-wave-map",
  "map-geo.js",
);

const VIEW_WIDTH = 1000; // viewBox width; height follows from the projection
const PADDING = 6; // viewBox px around the landmass
const SIMPLIFY_TOLERANCE = 0.16; // Douglas-Peucker, in viewBox px (~1.3px at 8x zoom)
const ANTARCTICA_LAT = -58; // rings entirely south of this are dropped
// Keep near-subpixel islets: cities sit on some of them (Mahé, Malé-sized
// islands), and a location bubble over empty ocean reads as a bug when zoomed.
const MIN_RING_AREA = 0.04; // px²

/* Natural Earth I projection (Šavrič et al. 2011), same formula as app.js.
   Input radians, output unitless map coordinates with +y pointing north. */
function naturalEarth1(lambda, phi) {
  const p2 = phi * phi;
  const p4 = p2 * p2;
  return [
    lambda * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4))),
    phi * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4))),
  ];
}

/* TopoJSON arc decoding: quantized delta-encoded points. */
function decodeArcs(topo) {
  const { scale, translate } = topo.transform;
  return topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
  });
}

function ringFromArcIndexes(indexes, arcs) {
  const ring = [];
  for (const index of indexes) {
    const arc = index >= 0 ? arcs[index] : arcs[~index].slice().reverse();
    // Consecutive arcs share an endpoint; skip it after the first arc.
    for (let i = ring.length ? 1 : 0; i < arc.length; i += 1) ring.push(arc[i]);
  }
  return ring;
}

function douglasPeucker(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    const [x1, y1] = points[first];
    const [x2, y2] = points[last];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    let maxDistSq = -1;
    let maxIndex = -1;
    for (let i = first + 1; i < last; i += 1) {
      const [px, py] = points[i];
      let distSq;
      if (lengthSq === 0) {
        distSq = (px - x1) ** 2 + (py - y1) ** 2;
      } else {
        const cross = dx * (py - y1) - dy * (px - x1);
        distSq = (cross * cross) / lengthSq;
      }
      if (distSq > maxDistSq) {
        maxDistSq = distSq;
        maxIndex = i;
      }
    }
    if (maxDistSq > tolerance * tolerance) {
      keep[maxIndex] = 1;
      stack.push([first, maxIndex], [maxIndex, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function ringArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

/* world-atlas merges country polygons topologically, which re-joins the
   pieces Natural Earth cuts at the antimeridian (Chukotka, Wrangel Island).
   Drawn flat, such rings smear horizontal bands across the map — unwrap the
   longitudes into a continuous ring, then clip it back into ±180° pieces. */

function unwrapRing(ring) {
  const out = [ring[0]];
  for (let i = 1; i < ring.length; i += 1) {
    let lon = ring[i][0];
    const prev = out[i - 1][0];
    if (lon - prev > 180) lon -= 360;
    else if (lon - prev < -180) lon += 360;
    out.push([lon, ring[i][1]]);
  }
  return out;
}

function clipRingAtLon(ring, boundary, keepBelow) {
  const inside = (p) => (keepBelow ? p[0] <= boundary : p[0] >= boundary);
  const intersect = (a, b) => {
    const t = (boundary - a[0]) / (b[0] - a[0]);
    return [boundary, a[1] + t * (b[1] - a[1])];
  };
  const out = [];
  for (let i = 0; i < ring.length; i += 1) {
    const cur = ring[i];
    const prev = ring[(i + ring.length - 1) % ring.length];
    if (inside(cur)) {
      if (!inside(prev)) out.push(intersect(prev, cur));
      out.push(cur);
    } else if (inside(prev)) {
      out.push(intersect(prev, cur));
    }
  }
  return out;
}

function splitAtAntimeridian(ring) {
  const last = ring[ring.length - 1];
  const closed = ring[0][0] === last[0] && ring[0][1] === last[1];
  const open = closed ? ring.slice(0, -1) : ring.slice();
  const crosses = open.some((point, i) => {
    const prev = open[(i + open.length - 1) % open.length];
    return Math.abs(point[0] - prev[0]) > 180;
  });
  if (!crosses) return [open];
  const unwrapped = unwrapRing(open);
  const pieces = [];
  for (const [boundary, keepBelow, shift] of [
    [180, true, 0],
    [180, false, -360],
    [-180, false, 0],
    [-180, true, 360],
  ]) {
    const piece = clipRingAtLon(unwrapped, boundary, keepBelow);
    if (piece.length < 3) continue;
    const shifted = shift ? piece.map(([lon, lat]) => [lon + shift, lat]) : piece;
    // Only keep pieces that actually live inside the world after shifting.
    if (shifted.every(([lon]) => lon >= -180.01 && lon <= 180.01)) pieces.push(shifted);
  }
  return pieces;
}

async function loadTopo() {
  const arg = process.argv[2];
  if (arg) return JSON.parse(readFileSync(arg, "utf8"));
  console.log(`Downloading ${SOURCE_URL} …`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.json();
}

const topo = await loadTopo();
const arcs = decodeArcs(topo);
const geometries =
  topo.objects.land.type === "GeometryCollection"
    ? topo.objects.land.geometries
    : [topo.objects.land];

// Collect lon/lat rings (outer rings and lake holes alike — fill-rule handles them).
const lonLatRings = [];
for (const geometry of geometries) {
  const polygons = geometry.type === "Polygon" ? [geometry.arcs] : geometry.arcs;
  for (const polygon of polygons) {
    for (const arcIndexes of polygon) {
      const ring = ringFromArcIndexes(arcIndexes, arcs);
      if (ring.every(([, lat]) => lat < ANTARCTICA_LAT)) continue;
      lonLatRings.push(...splitAtAntimeridian(ring));
    }
  }
}

// Project, then fit to the viewBox.
const RAD = Math.PI / 180;
const projected = lonLatRings.map((ring) =>
  ring.map(([lon, lat]) => naturalEarth1(lon * RAD, lat * RAD)),
);
let minX = Infinity;
let maxX = -Infinity;
let minY = Infinity;
let maxY = -Infinity;
for (const ring of projected) {
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
}
// screenX = cx + k*x, screenY = cy - k*y (projection +y points north).
const k = (VIEW_WIDTH - 2 * PADDING) / (maxX - minX);
const fittedCx = PADDING - minX * k;
const fittedCy = PADDING + maxY * k;
const height = Math.ceil(fittedCy - minY * k + PADDING);

function toScreen([x, y]) {
  return [fittedCx + k * x, fittedCy - k * y];
}

let ringCount = 0;
let pointCount = 0;
const pathParts = [];
for (const ring of projected) {
  const screen = ring.map(toScreen);
  // The ring is closed (first == last); simplify the open run and re-close with Z.
  const open = screen[0][0] === screen[screen.length - 1][0] &&
    screen[0][1] === screen[screen.length - 1][1]
    ? screen.slice(0, -1)
    : screen;
  const simplified = douglasPeucker(open, SIMPLIFY_TOLERANCE);
  if (simplified.length < 3 || ringArea(simplified) < MIN_RING_AREA) continue;
  ringCount += 1;
  pointCount += simplified.length;
  pathParts.push(
    `M${simplified.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`,
  );
}

const banner =
  "/* Generated by scripts/build-map-geo.mjs — do not edit by hand.\n" +
  ` * Source: world-atlas land-50m (Natural Earth, public domain), Antarctica dropped,\n` +
  ` * Natural Earth I projection, Douglas-Peucker tolerance ${SIMPLIFY_TOLERANCE}px at viewBox width ${VIEW_WIDTH}.\n` +
  " */\n";
const payload = {
  width: VIEW_WIDTH,
  height,
  k: Number(k.toFixed(4)),
  cx: Number(fittedCx.toFixed(4)),
  cy: Number(fittedCy.toFixed(4)),
  latClip: ANTARCTICA_LAT,
  land: pathParts.join(""),
};
writeFileSync(
  OUT_PATH,
  `${banner}window.YC_FINTECH_WAVE_MAP_GEO = ${JSON.stringify(payload)};\n`,
);

const bytes = JSON.stringify(payload).length;
console.log(
  `Wrote ${OUT_PATH}\n  viewBox 0 0 ${VIEW_WIDTH} ${height} · ${ringCount} rings · ${pointCount} points · ~${Math.round(bytes / 1024)}KB`,
);

// Sanity: a few well-known cities must land inside the viewBox.
const probes = [
  ["San Francisco", 37.7749, -122.4194],
  ["Singapore", 1.3521, 103.8198],
  ["London", 51.5074, -0.1278],
  ["Sydney", -33.8688, 151.2093],
  ["Honolulu", 21.3099, -157.8581],
];
for (const [name, lat, lon] of probes) {
  const [x, y] = naturalEarth1(lon * RAD, lat * RAD);
  const [sx, sy] = toScreen([x, y]);
  const inside = sx >= 0 && sx <= VIEW_WIDTH && sy >= 0 && sy <= height;
  console.log(`  probe ${name}: ${sx.toFixed(1)}, ${sy.toFixed(1)} ${inside ? "ok" : "OUT OF BOUNDS"}`);
  if (!inside) process.exitCode = 1;
}
