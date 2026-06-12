import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";

const dir = "/home/user/shawnpang.xyz/public/yc-fintech-wave-map";
const html = readFileSync(`${dir}/index.html`, "utf8");
const dataSrc = readFileSync(`${dir}/data.js`, "utf8");
const appSrc = readFileSync(`${dir}/app.js`, "utf8");

const dom = new JSDOM(html, {
  runScripts: "outside-only",
  url: "https://shawnpang.xyz/yc-fintech-wave-map/index.html",
  pretendToBeVisual: true,
});
const { window } = dom;
const { document } = window;

window.eval(dataSrc);
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

console.log(failures ? `\n${failures} FAILURES` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
