import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "yc-fintech-wave-map");
const html = readFileSync(`${dir}/index.html`, "utf8");
const dataSrc = readFileSync(`${dir}/data.js`, "utf8");
const geoSrc = readFileSync(`${dir}/map-geo.js`, "utf8");
const appSrc = readFileSync(`${dir}/app.js`, "utf8");

const dom = new JSDOM(html, {
  runScripts: "outside-only",
  url: "https://shawnpang.xyz/yc-fintech-wave-map/index.html",
  pretendToBeVisual: true,
});
const { window } = dom;
const { document } = window;

window.eval(dataSrc);
window.eval(geoSrc);
window.eval(appSrc);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let failures = 0;
function check(label, actual, expected) {
  const pass = expected === undefined ? Boolean(actual) : actual === expected;
  if (!pass) failures += 1;
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}` + (pass ? "" : ` (got: ${JSON.stringify(actual)}, want: ${JSON.stringify(expected)})`));
}

// Chrome
check("company count pill", document.getElementById("companyCountPill").textContent, "666 companies");
check("updated pill", document.getElementById("updatedPill").textContent, "Updated 2026-06-11");
check("footer updated", document.getElementById("footerUpdated").textContent, "2026-06-11");

// Spine
const spineCards = document.querySelectorAll("#waveSpine .spine-card");
check("spine has 5 cards", spineCards.length, 5);
check("last spine card emphasized", spineCards[4].classList.contains("is-current"), true);
check("spine is non-interactive (no buttons)", document.querySelectorAll("#waveSpine button").length, 0);
const spineTotal = Array.from(document.querySelectorAll(".spine-count")).reduce((sum, el) => sum + Number(el.textContent), 0);
check("spine counts sum to 666", spineTotal, 666);

// Summary + result row
check("summary has 5 metrics", document.querySelectorAll(".summary-card").length, 5);
check("first metric is 666", document.querySelector(".summary-value").textContent, "666");
check("result row", document.getElementById("resultCount").textContent.trim(), "666 companies shown");
check("clear-all hidden initially", document.getElementById("clearAll").hidden, true);

// Timeline
const waveBlocks = document.querySelectorAll("#timeline .wave-block");
check("timeline has 5 waves", waveBlocks.length, 5);
const firstLabel = waveBlocks[0].querySelector(".wave-head-label").textContent;
const lastDataWave = window.YC_FINTECH_WAVE_MAP_DATA.waves.at(-1).label;
check(`timeline newest-first (first block = ${lastDataWave})`, firstLabel, lastDataWave);
check("timeline renders 666 cards", document.querySelectorAll("#timeline .company-card").length, 666);

// Category
check("category has 11 theme cards", document.querySelectorAll(".category-card").length, 11);
check("category bars per card", document.querySelectorAll(".category-card")[0].querySelectorAll(".category-bar").length, 5);

// Table
check("table has 666 rows", document.querySelectorAll("#companyTable tbody tr").length, 666);
const years = Array.from(document.querySelectorAll("#companyTable tbody td.row-year")).map((td) => Number(td.textContent));
check("table sorted by year asc", years[0] <= years[years.length - 1], true);

// View switching
document.querySelector('[data-view="category"]').click();
check("category tab activates panel", document.getElementById("categoryView").classList.contains("is-active"), true);
check("timeline panel deactivated", document.getElementById("timelineView").classList.contains("is-active"), false);
document.querySelector('[data-view="timeline"]').click();

// Search (debounced 120ms)
const input = document.getElementById("searchInput");
input.value = "stripe";
input.dispatchEvent(new window.Event("input", { bubbles: true }));
await sleep(220);
const resultText = document.getElementById("resultCount").textContent.trim();
console.log(`INFO  search "stripe" -> ${resultText}`);
check("search narrows results", Number(resultText.split(" ")[0]) < 666 && Number(resultText.split(" ")[0]) > 0, true);
check("clear-all visible with search", document.getElementById("clearAll").hidden, false);
document.getElementById("clearAll").click();
check("clear-all resets count", document.getElementById("resultCount").textContent.trim(), "666 companies shown");
check("clear-all empties input", input.value, "");

// Wave filter menu
const waveBtn = document.getElementById("waveFilterButton");
waveBtn.click();
check("wave menu opens", document.getElementById("waveFilterMenu").hidden, false);
check("wave button aria-expanded", waveBtn.getAttribute("aria-expanded"), "true");
const firstWaveCheckbox = document.querySelector('#waveFilterMenu input[type="checkbox"]');
firstWaveCheckbox.checked = true;
firstWaveCheckbox.dispatchEvent(new window.Event("change", { bubbles: true }));
check("wave filter shows 1 wave in timeline", document.querySelectorAll("#timeline .wave-block").length, 1);
check("wave button label updates", document.getElementById("waveFilterValue").textContent.includes("·"), true);
document.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
check("outside click closes menu", document.getElementById("waveFilterMenu").hidden, true);
document.getElementById("clearAll").click();

// Drawer
const card = document.querySelector("#timeline .company-card");
const cardName = card.querySelector(".company-card-name").textContent;
card.click();
check("drawer opens", document.getElementById("drawer").classList.contains("is-open"), true);
check("drawer aria-hidden false", document.getElementById("drawer").getAttribute("aria-hidden"), "false");
check("drawer shows company name", document.querySelector("#drawerContent h2").textContent, cardName);
check("drawer has sections", document.querySelectorAll("#drawerContent .drawer-section").length >= 4, true);
check("scrim visible", document.getElementById("scrim").classList.contains("is-visible"), true);
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
check("escape closes drawer", document.getElementById("drawer").classList.contains("is-open"), false);

// Sort toggle
const yearTh = document.querySelector('#companyTable th[data-sort="year"]');
yearTh.click();
const yearsDesc = Array.from(document.querySelectorAll("#companyTable tbody td.row-year")).map((td) => Number(td.textContent));
check("year sort toggles to desc", yearsDesc[0] >= yearsDesc[yearsDesc.length - 1] && yearsDesc[0] !== yearsDesc[yearsDesc.length - 1], true);
check("sort arrow shows", yearTh.querySelector(".sort-arrow").textContent, "↓");

// Tooltip
const cloud = document.querySelector("#timeline .wave-cloud");
const hoverCard = cloud.querySelector(".company-card");
hoverCard.dispatchEvent(new window.MouseEvent("mouseover", { bubbles: true, clientX: 100, clientY: 100 }));
check("tooltip shows on hover", document.getElementById("tooltip").classList.contains("is-visible"), true);
hoverCard.dispatchEvent(new window.MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
check("tooltip hides on leaving the cloud", document.getElementById("tooltip").classList.contains("is-visible"), false);
hoverCard.dispatchEvent(new window.MouseEvent("mouseover", { bubbles: true, clientX: 100, clientY: 100 }));
const siblingCard = cloud.querySelectorAll(".company-card")[1];
hoverCard.dispatchEvent(new window.MouseEvent("mouseout", { bubbles: true, relatedTarget: siblingCard }));
check("tooltip stays when moving within the cloud", document.getElementById("tooltip").classList.contains("is-visible"), true);

// Hidden attribute must survive component display rules (live-site regression)
const css = readFileSync(`${dir}/styles.css`, "utf8");
check("[hidden] override rule present", /\[hidden\]\s*\{[^}]*display:\s*none\s*!important/m.test(css), true);
check("error panel still flagged hidden", document.getElementById("statePanel").hidden, true);

// Wave rail
const rail = document.getElementById("waveRail");
check("rail visible in timeline view", rail.hidden, false);
check("rail has 5 nodes", rail.querySelectorAll(".wave-rail-node").length, 5);
check("rail newest-first", rail.querySelector(".wave-rail-label").textContent, lastDataWave);
const railNode = rail.querySelectorAll(".wave-rail-node")[2];
railNode.click();
check("rail click activates node", railNode.classList.contains("is-active"), true);
document.querySelector('[data-view="category"]').click();
check("rail hidden in category view", rail.hidden, true);
document.querySelector('[data-view="timeline"]').click();
check("rail back in timeline view", rail.hidden, false);
// Filter to a single wave -> rail pointless, should hide
const waveBtn2 = document.getElementById("waveFilterButton");
waveBtn2.click();
const cb = document.querySelector('#waveFilterMenu input[type="checkbox"]');
cb.checked = true;
cb.dispatchEvent(new window.Event("change", { bubbles: true }));
check("rail hidden with single wave filter", rail.hidden, true);
document.getElementById("clearAll").click();
check("rail restored after clearing filters", rail.hidden, false);
check("timeline blocks carry wave ids", document.querySelectorAll("#timeline .wave-block[data-wave-id]").length, 5);

// Region filter (Africa cohort measured against data.js: 48 companies)
const regionBtn = document.getElementById("regionFilterButton");
regionBtn.click();
check("region menu opens", document.getElementById("regionFilterMenu").hidden, false);
const africaCb = document.querySelector('#regionFilterMenu input[value="africa"]');
africaCb.checked = true;
africaCb.dispatchEvent(new window.Event("change", { bubbles: true }));
check("africa filter narrows to cohort", document.getElementById("resultCount").textContent.trim(), "48 companies shown");
check("africa table rows match", document.querySelectorAll("#companyTable tbody tr").length, 48);
check("region button label updates", document.getElementById("regionFilterValue").textContent, "Africa");
document.getElementById("clearAll").click();
check("clearing region restores 666", document.getElementById("resultCount").textContent.trim(), "666 companies shown");

// Table: location column present, populated, sortable
check("table has 7 header cells", document.querySelectorAll("#companyTable thead th").length, 7);
const allRows7 = Array.from(document.querySelectorAll("#companyTable tbody tr")).every((tr) => tr.children.length === 7);
check("every table row has 7 cells", allRows7, true);
const sfCells = Array.from(document.querySelectorAll("#companyTable td.row-location")).filter(
  (td) => td.textContent.split(", ").includes("San Francisco"),
);
check("182 rows list San Francisco in the location column", sfCells.length, 182);
const locTh = document.querySelector('#companyTable th[data-sort="locationsText"]');
locTh.click();
// Unlisted companies display "—" but sort by their empty locationsText key
const locTexts = Array.from(document.querySelectorAll("#companyTable td.row-location")).map(
  (td) => (td.textContent === "—" ? "" : td.textContent),
);
const locSorted = locTexts.slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
check("location th sorts the table by location", locTexts.join("|"), locSorted.join("|"));
check("location sort arrow shows", locTh.querySelector(".sort-arrow").textContent, "↑");

// Location view
document.querySelector('[data-view="location"]').click();
check("location tab activates panel", document.getElementById("locationView").classList.contains("is-active"), true);
check(
  "location note totals",
  document.getElementById("locationNote").textContent,
  "121 locations · 41 countries — companies with offices in several places appear under each one.",
);
const cardByTitle = (title) =>
  Array.from(document.querySelectorAll(".location-card")).find(
    (card) => card.querySelector("h2").textContent === title,
  );
const countOf = (title) => {
  const card = cardByTitle(title);
  return card ? Number(card.querySelector(".location-count").textContent) : -1;
};
check("first location card is San Francisco", document.querySelector(".location-card h2").textContent, "San Francisco");
check("San Francisco count", countOf("San Francisco"), 182);
// Merged spellings (New York City->New York, Lagos LA->Lagos, London England->London,
// Bengaluru<->Bengaluru KA). Lagos raw strings sum to 41 but 13 companies list both
// spellings at once, so 28 distinct companies is the correct merged count.
check("New York merged count", countOf("New York"), 104);
check("Lagos merged count", countOf("Lagos"), 28);
check("London merged count", countOf("London"), 30);
check("Bengaluru merged count", countOf("Bengaluru"), 35);
check("Remote group present", countOf("Remote"), 145);
check("Unlisted group present", countOf("No location listed"), 27);
const sfCard = cardByTitle("San Francisco");
check("big city collapsed to 12 mini-cards", sfCard.querySelectorAll(".mini-card").length, 12);
check("expander label shows total", sfCard.querySelector(".location-more").textContent, "Show all 182");
sfCard.querySelector(".location-more").click();
check("expander shows all companies", cardByTitle("San Francisco").querySelectorAll(".mini-card").length, 182);
check("expander toggles to Show fewer", cardByTitle("San Francisco").querySelector(".location-more").textContent, "Show fewer");
cardByTitle("San Francisco").querySelector(".location-more").click();
check("expander collapses again", cardByTitle("San Francisco").querySelectorAll(".mini-card").length, 12);
const locMini = cardByTitle("San Francisco").querySelector(".mini-card");
const locMiniName = locMini.querySelector(".mini-card-name").textContent;
locMini.click();
check("location mini-card opens drawer", document.getElementById("drawer").classList.contains("is-open"), true);
check("drawer shows clicked company", document.querySelector("#drawerContent h2").textContent, locMiniName);
document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
check("drawer closed before words checks", document.getElementById("drawer").classList.contains("is-open"), false);

// Location map (map-geo.js + CITY_COORDS)
const mapWrap = document.getElementById("locationMapWrap");
check("map wrap unhidden when geo data loads", mapWrap.hidden, false);
const mapSvg = mapWrap.querySelector("svg.map-svg");
check("map svg renders", Boolean(mapSvg), true);
check("land path carries real geometry", (mapWrap.querySelector(".map-land").getAttribute("d") || "").length > 50000, true);
check("graticule present", Boolean(mapWrap.querySelector(".map-graticule")), true);
const bubbles = () => Array.from(mapWrap.querySelectorAll(".map-bubble"));
check("every distinct place gets a bubble (121)", bubbles().length, 121);
check("no places missing map coordinates", mapWrap.querySelectorAll(".map-missing").length, 0);
const maxBubble = bubbles().reduce((a, b) => (Number(b.getAttribute("r")) > Number(a.getAttribute("r")) ? b : a));
check("largest bubble is San Francisco", maxBubble.getAttribute("data-loc-key"), "San Francisco, CA, USA");
const labels = Array.from(mapWrap.querySelectorAll(".map-label")).map((t) => t.textContent);
check("top-tier city labels at world zoom", labels.length, 8);
check("San Francisco labeled", labels.includes("San Francisco"), true);
const remotePill = mapWrap.querySelector('.map-offmap-pill[data-loc-key="__remote__"]');
check("remote pill shows distributed count", remotePill && remotePill.textContent.includes("145"), true);
const unlistedPill = mapWrap.querySelector('.map-offmap-pill[data-loc-key="__unlisted__"]');
check("unlisted pill shows count", unlistedPill && unlistedPill.textContent.includes("27"), true);

// Bubble hover -> city tooltip
const sfBubble = bubbles().find((b) => b.getAttribute("data-loc-key") === "San Francisco, CA, USA");
sfBubble.dispatchEvent(new window.MouseEvent("mouseover", { bubbles: true, clientX: 120, clientY: 120 }));
check("city tooltip shows on bubble hover", document.getElementById("tooltip").classList.contains("is-visible"), true);
check("city tooltip names the city", document.querySelector("#tooltip .tooltip-name").textContent, "San Francisco");
check("city tooltip counts companies", document.querySelector("#tooltip .tooltip-citycount").textContent, "182 companies");
sfBubble.dispatchEvent(new window.MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
check("city tooltip hides on leave", document.getElementById("tooltip").classList.contains("is-visible"), false);

// Bubble click -> jumps to (flashes) the matching city card
sfBubble.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
check("bubble click flashes the city card", cardByTitle("San Francisco").classList.contains("is-flash"), true);
remotePill.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
check("remote pill flashes the Remote card", cardByTitle("Remote").classList.contains("is-flash"), true);

// Zoom controls rewrite the viewBox and re-scale bubbles
const baseViewBox = mapSvg.getAttribute("viewBox");
const baseRadius = Number(sfBubble.getAttribute("r"));
check("zoom-out disabled at world view", document.getElementById("mapZoomOut").disabled, true);
document.getElementById("mapZoomIn").click();
check("zoom-in narrows the viewBox", mapSvg.getAttribute("viewBox") !== baseViewBox, true);
check("map marked zoomed", mapWrap.classList.contains("is-zoomed"), true);
const zoomedRadius = Number(
  bubbles().find((b) => b.getAttribute("data-loc-key") === "San Francisco, CA, USA").getAttribute("r"),
);
check("bubbles counter-scale while zooming", zoomedRadius < baseRadius, true);
document.getElementById("mapZoomReset").click();
check("reset restores the world viewBox", mapSvg.getAttribute("viewBox"), baseViewBox);
check("zoomed class cleared on reset", mapWrap.classList.contains("is-zoomed"), false);

// Region filter narrows the map (Africa cohort spans 16 plottable places
// once co-located offices like SF and London are counted, plus Remote)
document.getElementById("regionFilterButton").click();
const africaMapCb = document.querySelector('#regionFilterMenu input[value="africa"]');
africaMapCb.checked = true;
africaMapCb.dispatchEvent(new window.Event("change", { bubbles: true }));
check("africa filter narrows bubbles", bubbles().length, 16);
check("africa filter keeps remote pill", Boolean(mapWrap.querySelector('.map-offmap-pill[data-loc-key="__remote__"]')), true);
check("africa filter drops unlisted pill", mapWrap.querySelector('.map-offmap-pill[data-loc-key="__unlisted__"]'), null);
const lagosBubble = bubbles().find((b) => b.getAttribute("data-loc-key") === "Lagos, Nigeria");
check("Lagos bubble present under africa filter", Boolean(lagosBubble), true);
document.getElementById("clearAll").click();
check("clearing filters restores 121 bubbles", bubbles().length, 121);

// Words view
document.querySelector('[data-view="words"]').click();
check("words tab activates panel", document.getElementById("wordsView").classList.contains("is-active"), true);
const chips = Array.from(document.querySelectorAll(".word-chip"));
check("cloud renders at least 20 words", chips.length >= 20, true);
const cloudWords = chips.map((chip) => chip.dataset.word);
check("no function-word stopwords in cloud", ["the", "and", "for", "with", "from"].some((word) => cloudWords.includes(word)), false);
check("no pure numbers in cloud", cloudWords.some((word) => /^\d+$/.test(word)), false);
check("domain words surface", ["payments", "financial", "banking"].every((word) => cloudWords.includes(word)), true);
check("top words are emphasized", document.querySelectorAll(".word-chip.is-top").length, 8);
const drillChip = chips[0];
const drillWord = drillChip.dataset.word;
const drillFreq = Number(drillChip.querySelector(".word-freq").textContent);
drillChip.click();
check("word click fills the search box", document.getElementById("searchInput").value, drillWord);
const drillCount = Number(document.getElementById("resultCount").textContent.trim().split(" ")[0]);
console.log(`INFO  word "${drillWord}" (doc freq ${drillFreq}) -> ${drillCount} companies`);
check("word click narrows results", drillCount >= drillFreq && drillCount < 666, true);
document.getElementById("clearAll").click();
check("clear after word drill-down restores 666", document.getElementById("resultCount").textContent.trim(), "666 companies shown");

console.log(failures ? `\n${failures} FAILURES` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
