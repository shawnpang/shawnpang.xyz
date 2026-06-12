# HANDOFF — YC Fintech Wave Map (work in progress on this branch)

**Branch state: `claude/optimistic-mayer-eqdyue` contains UNFINISHED work. Do NOT merge to
`main` until the acceptance checklist below passes.** Production (`main` = `3d20266`) is
live and healthy: AllScale redesign + `[hidden]` CSS fix + floating wave-jump rail.

## What the user asked for (in order)

1. ~~Redesign map page from AllScale design handoff~~ ✅ shipped
2. ~~Fix always-visible "Could not load the dataset" panel~~ ✅ shipped (`[hidden]{display:none!important}`)
3. ~~Floating wave timeline rail, click/drag to jump, mobile-friendly~~ ✅ shipped
4. ~~Verify company location data against YC API~~ ✅ done — **0 mismatches** (see below)
5. **Location view** (4th view) — IN PROGRESS
6. **Location column in Table view, sortable + filterable** — IN PROGRESS
7. **Words view** (word cloud of description terms, respects all filters) — NOT STARTED (UI)

## Data verification (task 4 — done, re-runnable)

`public/yc-fintech-wave-map/data.js` was diffed against a fresh pull of the YC OSS API.
All 666 companies matched by `slug`; `locations` and `regions` fields had **zero**
mismatches. Re-run with:

```bash
curl -s https://raw.githubusercontent.com/yc-oss/api/main/companies/all.json -o /tmp/yc_all.json
# (yc-oss.github.io and jsDelivr are blocked in the cloud sandbox; raw.githubusercontent.com works)
node -e "
const fs=require('fs');
const api=new Map(JSON.parse(fs.readFileSync('/tmp/yc_all.json','utf8')).map(c=>[c.slug,c]));
const window={};eval(fs.readFileSync('public/yc-fintech-wave-map/data.js','utf8'));
let bad=0;for(const c of window.YC_FINTECH_WAVE_MAP_DATA.companies){const a=api.get(c.slug);
if(!a||a.all_locations!==(c.locations||'')) {bad++;console.log(c.slug);}}
console.log(bad+' mismatches');"
```

Do not edit `data.js` for display concerns — YC's own strings contain duplicates
("New York, NY, USA" vs "New York City, NY, USA"); normalization lives in `app.js`
(`LOCATION_ALIASES`, `normalizeLocation`).

## Current WIP state (all in `public/yc-fintech-wave-map/`)

DONE in app.js:
- Geo block: `REGION_ORDER/REGION_LABELS/COUNTRY_REGION/LOCATION_ALIASES`,
  `normalizeLocation()`, `locationEntries()`, `cityMeta()`, `companyRegions()`;
  companies enriched with `locationsText`
- Global **Region** multi-select filter: `state.regions`, predicate in
  `filteredCompanies()`, options/labels/nouns wired, `renderFilters()` loops
  `["wave","theme","region","status"]`, clearAll + anyFilter include regions
- `els.panels` includes `location` and `words`; els has locationNote/locationGrid/wordsNote/wordCloud

DONE in index.html:
- Tabs: Timeline / Category / Location / Words / Table
- Region filter button+menu (`regionFilter*` ids); `locationView` + `wordsView` panels
- Table `<th data-sort="locationsText">Location</th>` (between Subindustry and Themes)

## What remains (precise TODO)

1. **renderTable**: emit `<td class="row-location">${escapeHtml(company.locationsText || "—")}</td>`
   between subindustry and themes tds. ⚠️ Until then the table is misaligned (7 th / 6 td)
   — this is THE blocker for merging.
2. **renderLocation(rows)**: group rows by `locationEntries()` key → cards sorted by count
   desc. Card: `cityMeta(key).title` h2 + count pill + subtitle (state, country) + single
   green proportion bar (vs max city, min-width 2%) + mini-cards (reuse `miniCardHtml`,
   cap 12, "Show all N"/"Show fewer" toggle via module-level `expandedLocations` Set,
   button `data-expand="<key>"`). Note line: "X locations · Y countries — companies with
   offices in several places appear under each one." Empty state like `.cloud-empty`.
3. **renderWords(rows)**: doc-frequency word counts over `oneLiner + longDescription`
   (lowercase, strip non `[a-z0-9'-]`, len ≥ 3, no pure numbers, per-company Set so one
   verbose company can't dominate). Stopword list = English function words + generic
   startup-speak (company, business, customers, platform-NO keep platform, help, build…)
   — keep domain words (payments, banking, stablecoin). Top 60 with count ≥ 2, sorted
   desc. Render as flex-wrap tag cloud: font-size `13 + sqrt(n/max)*23`px, top ~8 in
   green/600, others ink with scaled opacity, small DM Mono count superscript. Click a
   word → set `state.search` + `searchInput.value` + `renderViews()` (drill-down).
4. **renderViews()**: call `renderLocation(rows)` and `renderWords(rows)`; keep a
   module-level `lastRows` for the expander re-render.
5. **Events**: locationGrid click → `[data-expand]` toggle; add `els.locationGrid` to the
   click-delegation and hover-delegation container arrays (drawer + tooltips work free);
   wordCloud click handler.
6. **CSS** (styles.css — none of the new view styles exist yet): `.location-note`,
   `.location-grid` (auto-fit minmax(min(100%,330px),1fr) like category), `.location-card`
   (white, 1.5px var(--line), radius 16, padding 16), `.location-count` (black pill like
   `.wave-chip-count`), `.location-bar` (like `.category-bar-track/fill`), `.location-more`
   (green text button), `.word-cloud` (flex wrap, baseline, gap 10px 18px), `.word-chip`,
   `.word-freq`, `.row-location` (muted, max-width ~200px); bump `#companyTable`
   min-width 920 → ~1080.
7. **README** (map folder): document Location & Words views + Region filter.
8. Mobile: nothing special needed — chips/cards/cloud all wrap; verify at 375px width.

Design language rules: green `#009859` is the ONLY accent; DM Mono for numbers/codes;
1.5px `#E5EEEA` borders, radius 12–16; match existing cards. The hero wave spine stays
non-interactive (explicit user decision).

## How to test / accept

```bash
npm install --no-save jsdom
node scripts/smoke.test.mjs   # must print ALL CHECKS PASSED (run from repo root)
npm run lint && npm run build # both must pass
node --check public/yc-fintech-wave-map/app.js
```

`scripts/smoke.test.mjs` boots the real page in jsdom (real data.js + app.js, no browser
needed in the sandbox) and currently covers chrome/spine/summary/views/search/filters/
drawer/sort/tooltip/rail + the `[hidden]` regression. **Extend it** for acceptance:

- Region filter: check "Africa" → result count drops to the Africa cohort; table rows match
- Table: every `tbody tr` has 7 tds; first SF company shows its city in column 6;
  clicking the Location th sorts by `locationsText`
- Location view: tab activates panel; first card "San Francisco" count 182; merged
  spellings — New York 104 (82+22), Lagos 41 (24+17), London 30 (19+11), Bengaluru 35
  (32+3); "Show all" expander toggles; mini-card click opens drawer
- Words view: cloud renders ≥ 20 words; no stopwords ("the", "and") present; clicking a
  word sets the search input and narrows the result count
- Expected counts above assume no filters; dataset totals: 666 companies, 132 raw
  location strings, 43 countries

Manual acceptance on production after merge (`https://shawnpang.xyz/yc-fintech-wave-map/index.html`,
hard refresh): five tabs work, Region dropdown filters all views, table sortable by
Location, word click drills down, phone (≤760px) usable. NOTE: the cloud sandbox cannot
reach shawnpang.xyz (egress allowlist) — ask the user for a screenshot, or test locally
with `npx serve public` before merging.

## Ship procedure

Work/commit on `claude/optimistic-mayer-eqdyue`, then ff-merge to `main` and push — the
host auto-deploys `main` (verified). The user has standing approval for pushing this
work to `main` once complete; do not create PRs unless asked.
