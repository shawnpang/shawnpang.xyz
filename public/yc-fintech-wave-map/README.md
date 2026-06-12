# YC Fintech Wave Map

Standalone static map hosted at `/yc-fintech-wave-map/index.html`.

## Design

AllScale-branded interface: Archivo for UI, DM Mono for data, Playfair Display for the
narrative headline, with green `#009859` as the only accent on warm gray-green neutrals.
The hero frames the five waves with the corner-bracket logo motif and a non-interactive
wave spine; filtering lives entirely in the sticky controls bar (Timeline / Category /
Location / Words / Table views, search, and multi-select wave/theme/region/status
filters).

In the Timeline view a floating wave rail (left edge on desktop, right edge on phones)
tracks the wave currently in view; click or drag along it to jump between waves.

## Views

- **Timeline** — companies grouped by wave, newest wave first.
- **Category** — one card per theme with per-wave bars and keyword signals.
- **Location** — a zoomable world map (city bubbles sized by company count) above one
  card per city, sorted by company count. The land geometry is a Natural Earth
  projection pre-baked into `map-geo.js`; city dots are projected at runtime from the
  `CITY_COORDS` table in `app.js`. Hovering a bubble shows the city's count and sample
  companies; clicking it jumps to the matching city card. Zoom with the on-map
  controls, double-click, or ctrl/⌘ + scroll, and drag to pan once zoomed — bubble
  labels reveal progressively (with collision culling) as you zoom. Remote and
  no-location cohorts appear as pills under the map since they can't be plotted.
  YC's location strings are kept verbatim in `data.js`; duplicate spellings
  ("New York City" vs "New York", "Lagos, LA, Nigeria" vs "LA, Nigeria") are merged at
  display time by `normalizeLocation()` in `app.js`. Companies with offices in several
  places appear under each one; distributed teams group under **Remote**.
- **Words** — a tag cloud of recurring terms from YC one-liners and long descriptions.
  Counts are document frequency (each company votes once per word) with English function
  words and generic startup-speak filtered out. Click a word to run it through search and
  narrow every view.
- **Table** — sortable spreadsheet (company, year, wave, status, subindustry, location,
  themes).

The **Region** filter buckets companies by continent-scale regions derived from their
location countries (US & Canada, Latin America, Europe, Africa, Middle East, South Asia,
SE & East Asia, Oceania, Remote, No location listed); like every filter, it applies to
all five views at once.

## Source Data

The map is generated from the clean YC fintech/payments/stablecoin company dataset and enriched with public YC directory data.

Primary YC data sources:

- YC OSS company API: `https://yc-oss.github.io/api/companies/all.json`
- YC OSS metadata API: `https://yc-oss.github.io/api/meta.json`
- YC company directory pages: `https://www.ycombinator.com/companies/{slug}`

The YC OSS metadata timestamp embedded in `data.js` is:

`2026-06-11T02:44:14.468Z`

Founder LinkedIn and X links are parsed only from public YC company directory pages. No founder social profiles are inferred or guessed.

### Re-verifying locations against the YC API

`locations`/`regions` in `data.js` were last diffed against a fresh API pull on
2026-06-12 with zero mismatches across all 666 companies. To re-run the check:

```bash
curl -s https://raw.githubusercontent.com/yc-oss/api/main/companies/all.json -o /tmp/yc_all.json
node -e "
const fs=require('fs');
const api=new Map(JSON.parse(fs.readFileSync('/tmp/yc_all.json','utf8')).map(c=>[c.slug,c]));
const window={};eval(fs.readFileSync('public/yc-fintech-wave-map/data.js','utf8'));
let bad=0;for(const c of window.YC_FINTECH_WAVE_MAP_DATA.companies){const a=api.get(c.slug);
if(!a||a.all_locations!==(c.locations||'')) {bad++;console.log(c.slug);}}
console.log(bad+' mismatches');"
```

Keep `data.js` verbatim — display normalization (duplicate city spellings, bare state
codes) belongs in `app.js` (`LOCATION_ALIASES`, `normalizeLocation`).

### World map geometry

`map-geo.js` is a build artifact: world-atlas `land-50m.json` (Natural Earth data,
public domain) decoded from TopoJSON, Antarctica dropped, antimeridian-wrapping rings
split, projected with Natural Earth I, Douglas-Peucker simplified, and written as SVG
path data in viewBox pixels. Regenerate it with:

```bash
node scripts/build-map-geo.mjs            # downloads land-50m.json from jsdelivr
node scripts/build-map-geo.mjs local.json # or use a local copy
```

The file also carries the projection constants (`k`, `cx`, `cy`) that `app.js` uses to
plot cities, so the projection formula in `projectCity()` must stay identical to the
one in the build script. New cities only need a `CITY_COORDS` entry in `app.js`
(lat/lng keyed by normalized location); a missing entry degrades to a note under the
map, and a missing `map-geo.js` degrades the Location view to cards only.

## Testing

`scripts/smoke.test.mjs` (repo root) boots this page in jsdom — real `data.js`,
`map-geo.js`, and `app.js`, no browser needed — and asserts the chrome, all five views,
search, filters, drawer, sorting, tooltips, the wave rail, the location/word acceptance
counts, and the location map (bubble counts, labels, city tooltips, zoom controls,
off-map pills):

```bash
npm install --no-save jsdom
node scripts/smoke.test.mjs   # must print ALL CHECKS PASSED
```

## Current Coverage

- Companies: `666`
- Founders parsed from YC directory pages: `1,302`
- Companies with founder social links: `657`
- Founder LinkedIn links: `1,282`
- Founder X links: `548`

## Attribution

Built by Shawn Pang from AllScale.

- AllScale: `https://allscale.io`
- X: `https://x.com/0xshawnpang`
- LinkedIn: `https://www.linkedin.com/in/shawnshunxinpang/`
