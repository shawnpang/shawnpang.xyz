(function () {
  const data = window.YC_FINTECH_WAVE_MAP_DATA;

  const els = {
    companyCountPill: document.getElementById("companyCountPill"),
    updatedPill: document.getElementById("updatedPill"),
    footerUpdated: document.getElementById("footerUpdated"),
    waveSpine: document.getElementById("waveSpine"),
    statePanel: document.getElementById("statePanel"),
    summaryBand: document.getElementById("summaryBand"),
    resultCount: document.getElementById("resultCount"),
    clearAll: document.getElementById("clearAll"),
    tabs: Array.from(document.querySelectorAll(".view-tab")),
    panels: {
      timeline: document.getElementById("timelineView"),
      category: document.getElementById("categoryView"),
      location: document.getElementById("locationView"),
      words: document.getElementById("wordsView"),
      spreadsheet: document.getElementById("spreadsheetView"),
    },
    locationNote: document.getElementById("locationNote"),
    locationGrid: document.getElementById("locationGrid"),
    wordsNote: document.getElementById("wordsNote"),
    wordCloud: document.getElementById("wordCloud"),
    searchInput: document.getElementById("searchInput"),
    filters: Array.from(document.querySelectorAll(".filter")),
    filterButtons: {
      wave: document.getElementById("waveFilterButton"),
      theme: document.getElementById("themeFilterButton"),
      region: document.getElementById("regionFilterButton"),
      status: document.getElementById("statusFilterButton"),
    },
    filterMenus: {
      wave: document.getElementById("waveFilterMenu"),
      theme: document.getElementById("themeFilterMenu"),
      region: document.getElementById("regionFilterMenu"),
      status: document.getElementById("statusFilterMenu"),
    },
    filterValues: {
      wave: document.getElementById("waveFilterValue"),
      theme: document.getElementById("themeFilterValue"),
      region: document.getElementById("regionFilterValue"),
      status: document.getElementById("statusFilterValue"),
    },
    controls: document.querySelector(".controls"),
    waveRail: document.getElementById("waveRail"),
    timeline: document.getElementById("timeline"),
    categoryGrid: document.getElementById("categoryGrid"),
    tableBody: document.querySelector("#companyTable tbody"),
    tableHeads: Array.from(document.querySelectorAll("#companyTable th[data-sort]")),
    tableEmpty: document.getElementById("tableEmpty"),
    tooltip: document.getElementById("tooltip"),
    drawer: document.getElementById("drawer"),
    drawerContent: document.getElementById("drawerContent"),
    scrim: document.getElementById("scrim"),
  };

  if (!data) {
    els.statePanel.hidden = false;
    els.summaryBand.hidden = true;
    document.querySelector(".result-row").hidden = true;
    Object.values(els.panels).forEach((panel) => {
      panel.hidden = true;
    });
    return;
  }

  const themeMap = {};
  data.themes.forEach((theme) => {
    themeMap[theme.id] = theme;
  });
  const waveMap = {};
  data.waves.forEach((wave) => {
    waveMap[wave.id] = wave;
  });

  /* Geography — YC location strings are kept verbatim in data.js; the same
     city appears under several spellings, so normalize at display time only. */

  const REGION_ORDER = [
    "us-canada",
    "latam",
    "europe",
    "africa",
    "mena",
    "south-asia",
    "se-east-asia",
    "oceania",
    "remote",
    "unlisted",
    "other",
  ];
  const REGION_LABELS = {
    "us-canada": "US & Canada",
    latam: "Latin America",
    europe: "Europe",
    africa: "Africa",
    mena: "Middle East",
    "south-asia": "South Asia",
    "se-east-asia": "SE & East Asia",
    oceania: "Oceania",
    remote: "Remote",
    unlisted: "No location listed",
    other: "Other",
  };
  const COUNTRY_REGION = {
    USA: "us-canada",
    "United States": "us-canada",
    Canada: "us-canada",
    Mexico: "latam",
    Brazil: "latam",
    Colombia: "latam",
    Chile: "latam",
    Argentina: "latam",
    Peru: "latam",
    Panama: "latam",
    "Costa Rica": "latam",
    "United Kingdom": "europe",
    France: "europe",
    Spain: "europe",
    Denmark: "europe",
    Estonia: "europe",
    Germany: "europe",
    Georgia: "europe",
    Nigeria: "africa",
    Kenya: "africa",
    Egypt: "africa",
    Senegal: "africa",
    Ghana: "africa",
    "Ivory Coast": "africa",
    "South Africa": "africa",
    Namibia: "africa",
    Zambia: "africa",
    Uganda: "africa",
    "Democratic Republic of the Congo": "africa",
    Seychelles: "africa",
    Israel: "mena",
    "United Arab Emirates": "mena",
    "Saudi Arabia": "mena",
    Bahrain: "mena",
    India: "south-asia",
    Pakistan: "south-asia",
    Singapore: "se-east-asia",
    Indonesia: "se-east-asia",
    Vietnam: "se-east-asia",
    Philippines: "se-east-asia",
    "South Korea": "se-east-asia",
    Australia: "oceania",
  };
  // True duplicates and bare state codes in YC's own data
  const LOCATION_ALIASES = {
    "New York City, NY, USA": "New York, NY, USA",
    "London, England, United Kingdom": "London, United Kingdom",
    "Lagos, LA, Nigeria": "Lagos, Nigeria",
    "LA, Nigeria": "Lagos, Nigeria",
    "Bengaluru, India": "Bengaluru, KA, India",
    "Lima, Callao Region, Peru": "Lima, Peru",
    "Lima, Lima Province, Peru": "Lima, Peru",
    "MH, India": "Maharashtra, India",
    "HR, India": "Haryana, India",
    "CT, Spain": "Catalonia, Spain",
    "DF, Brazil": "Distrito Federal, Brazil",
    "MG, Brazil": "Minas Gerais, Brazil",
    "N.L., Mexico": "Nuevo León, Mexico",
  };

  function normalizeLocation(raw) {
    if (raw === "Remote") return "__remote__";
    let parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
    // Collapse "Dubai, Dubai, UAE" / "Panama City, Panama, Panama" shapes
    if (parts.length >= 2 && parts[0] === parts[1]) parts.splice(1, 1);
    if (parts.length >= 3 && parts[1] === parts[2]) parts.splice(1, 1);
    if (parts.length === 2 && parts[0] === parts[1]) parts = [parts[0]];
    const joined = parts.join(", ");
    return LOCATION_ALIASES[joined] || joined;
  }

  function locationEntries(company) {
    if (company._locs) return company._locs;
    const parts = String(company.locations || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean);
    const keys = parts.length
      ? Array.from(new Set(parts.map(normalizeLocation)))
      : ["__unlisted__"];
    company._locs = keys;
    return keys;
  }

  const cityMetaCache = new Map();
  function cityMeta(key) {
    if (cityMetaCache.has(key)) return cityMetaCache.get(key);
    let meta;
    if (key === "__remote__") {
      meta = { title: "Remote", subtitle: "Distributed teams", country: "", region: "remote" };
    } else if (key === "__unlisted__") {
      meta = { title: "No location listed", subtitle: "Not provided on YC", country: "", region: "unlisted" };
    } else {
      const parts = key.split(",").map((part) => part.trim());
      const country = parts[parts.length - 1];
      const region = COUNTRY_REGION[country] || "other";
      meta = {
        title: parts.length > 1 ? parts[0] : key,
        subtitle: parts.length > 1 ? parts.slice(1).join(", ") : REGION_LABELS[region],
        country,
        region,
      };
    }
    cityMetaCache.set(key, meta);
    return meta;
  }

  function companyRegions(company) {
    if (!company._regions) {
      company._regions = new Set(locationEntries(company).map((key) => cityMeta(key).region));
    }
    return company._regions;
  }

  const companies = data.companies.map((company) => {
    const enriched = {
      ...company,
      themesText: (company.themes || [])
        .map((themeId) => (themeMap[themeId] ? themeMap[themeId].label : themeId))
        .join(", "),
    };
    enriched.locationsText = locationEntries(enriched)
      .map((key) => cityMeta(key).title)
      .filter((title) => title !== "No location listed")
      .join(", ");
    return enriched;
  });
  const byId = {};
  companies.forEach((company) => {
    byId[company.id] = company;
  });

  const statusList = Array.from(new Set(companies.map((company) => company.status))).sort();
  const waveCounts = {};
  let maxWaveCount = 1;
  data.waves.forEach((wave) => {
    const count = companies.filter((company) => company.wave === wave.id).length;
    waveCounts[wave.id] = count;
    if (count > maxWaveCount) maxWaveCount = count;
  });

  const state = {
    view: "timeline",
    search: "",
    waves: [],
    themes: [],
    regions: [],
    statuses: [],
    openMenu: "",
    sortKey: "year",
    sortDir: "asc",
    selectedId: null,
  };

  function themeLabel(themeId) {
    return themeMap[themeId] ? themeMap[themeId].label : themeId;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function pct(numerator, denominator) {
    if (!denominator) return "0%";
    return `${((numerator / denominator) * 100).toFixed(0)}%`;
  }

  function initials(name) {
    return (
      String(name || "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "–"
    );
  }

  function cleanLogo(company) {
    const logo = company.logo;
    return logo && !/missing\.png$/.test(logo) ? logo : "";
  }

  function statusClass(status) {
    const key = String(status || "").toLowerCase();
    return ["active", "acquired", "public"].includes(key) ? `status-${key}` : "";
  }

  function statusPill(status, small) {
    const sizeClass = small ? " status-pill--sm" : "";
    return `<span class="status-pill ${statusClass(status)}${sizeClass}">${escapeHtml(status)}</span>`;
  }

  function logoHtml(company, variant) {
    const logo = cleanLogo(company);
    const img = logo ? `<img src="${escapeHtml(logo)}" alt="" loading="lazy" />` : "";
    return `<span class="logo logo-${variant}"><span>${escapeHtml(initials(company.name))}</span>${img}</span>`;
  }

  function searchable(company) {
    if (company._s) return company._s;
    company._s = [
      company.name,
      company.year,
      company.batch,
      company.status,
      company.subindustry,
      company.oneLiner,
      company.longDescription,
      (company.founders || [])
        .map((founder) => [founder.name, founder.title, founder.linkedinUrl, founder.xUrl].join(" "))
        .join(" "),
      (company.tags || []).join(" "),
      company.themesText,
      (company.auditEvidence || []).join(" "),
      company.locations,
      (company.regions || []).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return company._s;
  }

  function filteredCompanies() {
    const query = state.search.trim().toLowerCase();
    return companies.filter((company) => {
      if (state.waves.length && !state.waves.includes(company.wave)) return false;
      if (
        state.themes.length &&
        !(company.themes || []).some((themeId) => state.themes.includes(themeId))
      ) {
        return false;
      }
      if (
        state.regions.length &&
        !state.regions.some((regionId) => companyRegions(company).has(regionId))
      ) {
        return false;
      }
      if (state.statuses.length && !state.statuses.includes(company.status)) return false;
      if (query && !searchable(company).includes(query)) return false;
      return true;
    });
  }

  /* Static chrome: meta pills, footer date, wave spine */

  const updatedLabel = data.meta && data.meta.generatedAt
    ? new Date(data.meta.generatedAt).toISOString().slice(0, 10)
    : "2026-06-11";

  function renderChrome() {
    els.companyCountPill.textContent = `${data.meta.companyCount || companies.length} companies`;
    els.updatedPill.textContent = `Updated ${updatedLabel}`;
    els.footerUpdated.textContent = updatedLabel;

    els.waveSpine.innerHTML = data.waves
      .map((wave, index) => {
        const isCurrent = index === data.waves.length - 1;
        const widthPct = Math.round((waveCounts[wave.id] / maxWaveCount) * 100);
        return `
          <div class="spine-card${isCurrent ? " is-current" : ""}">
            <span class="spine-label">${escapeHtml(wave.label)}</span>
            <span class="spine-name">${escapeHtml(wave.name)}</span>
            <span class="spine-count-row">
              <span class="spine-count">${waveCounts[wave.id]}</span>
              <span class="spine-bar"><span class="spine-bar-fill" style="width:${widthPct}%"></span></span>
            </span>
          </div>`;
      })
      .join("");
  }

  /* Filters */

  const presentRegions = REGION_ORDER.filter((regionId) =>
    companies.some((company) => companyRegions(company).has(regionId)),
  );

  const filterOptions = {
    wave: () =>
      data.waves.map((wave) => ({
        value: wave.id,
        label: `${wave.label} · ${wave.name}`,
      })),
    theme: () => data.themes.map((theme) => ({ value: theme.id, label: theme.label })),
    region: () =>
      presentRegions.map((regionId) => ({ value: regionId, label: REGION_LABELS[regionId] })),
    status: () => statusList.map((status) => ({ value: status, label: status })),
  };
  const filterStateKey = { wave: "waves", theme: "themes", region: "regions", status: "statuses" };
  const filterAllLabel = {
    wave: "All waves",
    theme: "All themes",
    region: "All regions",
    status: "All statuses",
  };
  const filterNoun = { wave: "waves", theme: "themes", region: "regions", status: "statuses" };

  function renderFilters() {
    ["wave", "theme", "region", "status"].forEach((kind) => {
      const selected = state[filterStateKey[kind]];
      const options = filterOptions[kind]();
      const open = state.openMenu === kind;

      els.filterMenus[kind].innerHTML =
        `<button type="button" class="filter-clear" data-filter="${kind}">${filterAllLabel[kind]}</button>` +
        options
          .map(
            (option) => `
              <label class="filter-option">
                <input type="checkbox" data-filter="${kind}" value="${escapeHtml(option.value)}" ${
                  selected.includes(option.value) ? "checked" : ""
                } />
                <span>${escapeHtml(option.label)}</span>
              </label>`,
          )
          .join("");
      els.filterMenus[kind].hidden = !open;
      els.filterButtons[kind].setAttribute("aria-expanded", String(open));

      const wrapper = els.filterButtons[kind].closest(".filter");
      wrapper.classList.toggle("is-open", open);
      wrapper.classList.toggle("has-selection", selected.length > 0);

      let label = filterAllLabel[kind];
      if (selected.length === 1) {
        const match = options.find((option) => option.value === selected[0]);
        label = match ? match.label : label;
      } else if (selected.length > 1) {
        label = `${selected.length} ${filterNoun[kind]}`;
      }
      els.filterValues[kind].textContent = label;
    });
  }

  /* Summary band and result row */

  function renderSummary(rows) {
    const active = rows.filter((company) => company.status === "Active").length;
    const ai = rows.filter((company) => (company.themes || []).includes("ai-native-finance")).length;
    const payments = rows.filter((company) => company.isPayments).length;
    const stablecoin = rows.filter((company) => company.isStablecoin).length;
    const metrics = [
      { value: String(rows.length), label: "matching companies", green: false },
      { value: pct(active, rows.length), label: "active by YC status", green: true },
      { value: pct(ai, rows.length), label: "AI-native finance signal", green: true },
      { value: pct(payments, rows.length), label: "payments tag or subindustry", green: false },
      { value: String(stablecoin), label: "product-level stablecoin", green: false },
    ];
    els.summaryBand.innerHTML = metrics
      .map(
        (metric) => `
          <div class="summary-card${metric.green ? " is-green" : ""}">
            <strong class="summary-value">${escapeHtml(metric.value)}</strong>
            <span class="summary-label">${escapeHtml(metric.label)}</span>
          </div>`,
      )
      .join("");
  }

  function renderResultRow(rows) {
    const noun = rows.length === 1 ? "company shown" : "companies shown";
    els.resultCount.innerHTML = `<strong>${rows.length}</strong> ${noun}`;
    const anyFilter = Boolean(
      state.waves.length ||
        state.themes.length ||
        state.regions.length ||
        state.statuses.length ||
        state.search.trim(),
    );
    els.clearAll.hidden = !anyFilter;
  }

  /* Timeline view */

  function companyCardHtml(company) {
    const firstTheme = (company.themes || [])[0];
    return `
      <button type="button" class="company-card" data-company-id="${escapeHtml(company.id)}">
        ${logoHtml(company, "card")}
        <span class="company-card-body">
          <span class="company-card-name">${escapeHtml(company.name)}</span>
          <span class="company-card-meta">
            <span class="company-card-year">${escapeHtml(String(company.year))}</span>
            ${statusPill(company.status, true)}
          </span>
          <span class="company-card-theme">${escapeHtml(firstTheme ? themeLabel(firstTheme) : "Unclassified")}</span>
        </span>
      </button>`;
  }

  function renderTimeline(rows) {
    const byWave = {};
    data.waves.forEach((wave) => {
      byWave[wave.id] = [];
    });
    rows.forEach((company) => {
      if (byWave[company.wave]) byWave[company.wave].push(company);
    });

    const visibleWaves = data.waves
      .filter((wave) => !state.waves.length || state.waves.includes(wave.id))
      .slice()
      .reverse();

    els.timeline.innerHTML = visibleWaves
      .map((wave) => {
        const waveRows = byWave[wave.id] || [];
        const aiCount = waveRows.filter((company) =>
          (company.themes || []).includes("ai-native-finance"),
        ).length;
        const themeCounts = new Map();
        waveRows.forEach((company) =>
          (company.themes || []).forEach((themeId) =>
            themeCounts.set(themeId, (themeCounts.get(themeId) || 0) + 1),
          ),
        );
        const topThemes = Array.from(themeCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(
            ([themeId, count]) =>
              `<span class="wave-chip wave-chip-theme">${escapeHtml(themeLabel(themeId))} · ${count}</span>`,
          )
          .join("");
        const cloud = waveRows.length
          ? waveRows.map(companyCardHtml).join("")
          : `<div class="cloud-empty">No companies match these filters in this wave.</div>`;
        return `
          <article class="wave-block" data-wave-id="${escapeHtml(wave.id)}">
            <div class="wave-head">
              <span class="wave-head-label">${escapeHtml(wave.label)}</span>
              <h2>${escapeHtml(wave.name)}</h2>
              <p class="wave-head-summary">${escapeHtml(wave.summary)}</p>
              <div class="wave-chips">
                <span class="wave-chip wave-chip-count">${waveRows.length} ${waveRows.length === 1 ? "company" : "companies"}</span>
                <span class="wave-chip">${pct(aiCount, waveRows.length)} AI signal</span>
                ${topThemes}
              </div>
            </div>
            <div class="wave-cloud" data-hoverable>${cloud}</div>
          </article>`;
      })
      .join("");

    renderRail(visibleWaves);
  }

  /* Category view */

  function miniCardHtml(company) {
    return `
      <button type="button" class="mini-card" data-company-id="${escapeHtml(company.id)}">
        ${logoHtml(company, "mini")}
        <span class="mini-card-body">
          <span class="mini-card-name">${escapeHtml(company.name)}</span>
          <span class="mini-card-year">${escapeHtml(String(company.year))}</span>
        </span>
      </button>`;
  }

  function renderCategory(rows) {
    const selectedThemes = state.themes.length
      ? data.themes.filter((theme) => state.themes.includes(theme.id))
      : data.themes;

    let maxCell = 1;
    selectedThemes.forEach((theme) =>
      data.waves.forEach((wave) => {
        const count = rows.filter(
          (company) => company.wave === wave.id && (company.themes || []).includes(theme.id),
        ).length;
        if (count > maxCell) maxCell = count;
      }),
    );

    els.categoryGrid.innerHTML = selectedThemes
      .map((theme) => {
        const themeRows = rows.filter((company) => (company.themes || []).includes(theme.id));
        const keywordCounts = new Map();
        themeRows.forEach((company) =>
          ((company.themeHits || {})[theme.id] || []).forEach((keyword) =>
            keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1),
          ),
        );
        const keywords = Array.from(keywordCounts.entries())
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 6)
          .map(([keyword, count]) => `<span class="keyword-chip">${escapeHtml(keyword)} · ${count}</span>`);
        const bars = data.waves
          .map((wave) => {
            const count = themeRows.filter((company) => company.wave === wave.id).length;
            const widthPct = Math.max(2, Math.round((count / maxCell) * 100));
            return `
              <div class="category-bar">
                <span class="category-bar-label">${escapeHtml(wave.label)}</span>
                <span class="category-bar-track"><span class="category-bar-fill" style="width:${widthPct}%"></span></span>
                <strong class="category-bar-count">${count}</strong>
              </div>`;
          })
          .join("");
        const cards = themeRows.length
          ? themeRows.slice(0, 60).map(miniCardHtml).join("")
          : `<div class="category-empty">No companies in this category.</div>`;
        return `
          <article class="category-card">
            <h2>${escapeHtml(theme.label)}</h2>
            <p class="category-count">${themeRows.length} ${themeRows.length === 1 ? "company" : "companies"} across the current filters.</p>
            <div class="category-keywords">${keywords.join("") || '<span class="keyword-chip">No keyword hits</span>'}</div>
            <div class="category-bars">${bars}</div>
            <div class="category-companies" data-hoverable>${cards}</div>
          </article>`;
      })
      .join("");
  }

  /* Table view */

  function renderTable(rows) {
    const sorted = rows.slice().sort((a, b) => {
      const key = state.sortKey;
      let aVal = a[key];
      let bVal = b[key];
      aVal = aVal == null ? "" : aVal;
      bVal = bVal == null ? "" : bVal;
      let result;
      if (typeof aVal === "number" && typeof bVal === "number") {
        result = aVal - bVal;
      } else {
        result = String(aVal).localeCompare(String(bVal), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }
      return state.sortDir === "asc" ? result : -result;
    });

    els.tableBody.innerHTML = sorted
      .map((company) => {
        const themeChips = (company.themes || [])
          .slice(0, 3)
          .map((themeId) => `<span class="row-theme-chip">${escapeHtml(themeLabel(themeId))}</span>`)
          .join("");
        return `
          <tr data-company-id="${escapeHtml(company.id)}">
            <td>
              <div class="row-company">
                ${logoHtml(company, "row")}
                <span class="row-company-body">
                  <strong class="row-company-name">${escapeHtml(company.name)}</strong>
                  <span class="row-company-oneliner">${escapeHtml(company.oneLiner || "No YC one-liner")}</span>
                </span>
              </div>
            </td>
            <td class="row-year">${escapeHtml(String(company.year))}</td>
            <td class="row-wave">${escapeHtml(company.waveLabel)}</td>
            <td>${statusPill(company.status, false)}</td>
            <td class="row-subindustry">${escapeHtml(company.subindustry || "—")}</td>
            <td><div class="row-themes">${themeChips}</div></td>
          </tr>`;
      })
      .join("");
    els.tableEmpty.hidden = sorted.length > 0;

    els.tableHeads.forEach((th) => {
      const arrow = th.querySelector(".sort-arrow");
      arrow.textContent =
        th.dataset.sort === state.sortKey ? (state.sortDir === "asc" ? "↑" : "↓") : "";
    });
  }

  /* Tooltip */

  function showTooltip(company, event) {
    const sc = statusPill(company.status, false);
    const firstTheme = (company.themes || [])[0];
    const signals = firstTheme
      ? ((company.themeHits || {})[firstTheme] || []).slice(0, 4).join(", ")
      : "";
    const founders = (company.founders || [])
      .slice(0, 3)
      .map((founder) => founder.name)
      .filter(Boolean)
      .join(", ");
    const chips = (company.themes || [])
      .map((themeId) => `<span class="tooltip-chip">${escapeHtml(themeLabel(themeId))}</span>`)
      .join("");
    els.tooltip.innerHTML = `
      <div class="tooltip-inner">
        <div class="tooltip-head">
          <span class="tooltip-name">${escapeHtml(company.name)}</span>
          ${sc}
        </div>
        <p class="tooltip-oneliner">${escapeHtml(company.oneLiner || company.subindustry || "No YC one-liner")}</p>
        ${founders ? `<p class="tooltip-founders"><strong>Founders</strong> · ${escapeHtml(founders)}</p>` : ""}
        <div class="tooltip-chips">${chips || '<span class="tooltip-unclassified">Unclassified</span>'}</div>
        ${signals ? `<p class="tooltip-signals"><strong>Signals</strong> · ${escapeHtml(signals)}</p>` : ""}
      </div>`;
    els.tooltip.classList.add("is-visible");
    positionTooltip(event);
  }

  function positionTooltip(event) {
    if (!els.tooltip.classList.contains("is-visible")) return;
    const margin = 14;
    const box = els.tooltip.getBoundingClientRect();
    let left = (event.clientX || 0) + margin;
    let top = (event.clientY || 0) + margin;
    if (left + box.width > window.innerWidth) left = window.innerWidth - box.width - margin;
    if (top + box.height > window.innerHeight) top = window.innerHeight - box.height - margin;
    els.tooltip.style.left = `${Math.max(margin, left)}px`;
    els.tooltip.style.top = `${Math.max(margin, top)}px`;
  }

  function hideTooltip() {
    els.tooltip.classList.remove("is-visible");
  }

  /* Drawer */

  function drawerHtml(company) {
    const wave = waveMap[company.wave];
    const founders = (company.founders || [])
      .map((founder) => {
        const links = [
          founder.linkedinUrl
            ? `<a href="${escapeHtml(founder.linkedinUrl)}" target="_blank" rel="noreferrer">LinkedIn</a>`
            : "",
          founder.xUrl
            ? `<a href="${escapeHtml(founder.xUrl)}" target="_blank" rel="noreferrer">X</a>`
            : "",
        ]
          .filter(Boolean)
          .join("");
        return `
          <div class="founder-row">
            <div class="founder-id">
              <strong class="founder-name">${escapeHtml(founder.name || "Founder")}</strong>
              ${founder.title ? `<span class="founder-title">${escapeHtml(founder.title)}</span>` : ""}
            </div>
            <div class="founder-links">
              ${links || '<span class="founder-nolinks">No YC social link</span>'}
            </div>
          </div>`;
      })
      .join("");

    const links = [
      company.website
        ? `<a class="is-primary" href="${escapeHtml(company.website)}" target="_blank" rel="noreferrer">Website</a>`
        : "",
      company.ycUrl
        ? `<a href="${escapeHtml(company.ycUrl)}" target="_blank" rel="noreferrer">YC directory</a>`
        : "",
      company.linkedinSearch
        ? `<a href="${escapeHtml(company.linkedinSearch)}" target="_blank" rel="noreferrer">LinkedIn search</a>`
        : "",
      company.xSearch
        ? `<a href="${escapeHtml(company.xSearch)}" target="_blank" rel="noreferrer">X search</a>`
        : "",
    ]
      .filter(Boolean)
      .join("");

    const detailItems = [
      { label: "Subindustry", value: company.subindustry || "Unknown" },
      { label: "Team size", value: String(company.teamSize || "Unknown") },
      { label: "Location", value: company.locations || "Unknown" },
      { label: "Stage", value: company.stage || "Unknown" },
      { label: "Payments", value: company.isPayments ? "Yes" : "No" },
      { label: "Stablecoin", value: company.isStablecoin ? "Yes" : "No" },
    ]
      .map(
        (item) => `
          <div class="detail-cell">
            <span class="detail-label">${escapeHtml(item.label)}</span>
            <span class="detail-value">${escapeHtml(item.value)}</span>
          </div>`,
      )
      .join("");

    const themeDetails = (company.themes || [])
      .map(
        (themeId) => `
          <div class="signal-card">
            <span class="signal-label">${escapeHtml(themeLabel(themeId))}</span>
            <span class="signal-hits">${escapeHtml(
              ((company.themeHits || {})[themeId] || []).join(", ") || "Theme match",
            )}</span>
          </div>`,
      )
      .join("");

    return `
      <div class="drawer-body">
        <button type="button" class="drawer-close" id="drawerClose" aria-label="Close details">✕</button>
        <div class="drawer-head">
          ${logoHtml(company, "drawer")}
          <div class="drawer-head-body">
            <h2>${escapeHtml(company.name)}</h2>
            <div class="drawer-head-meta">
              <span class="drawer-batch">${escapeHtml(company.batch || "—")}</span>
              ${statusPill(company.status, false)}
              ${company.topCompany ? '<span class="badge-top">Top company</span>' : ""}
              ${company.isHiring ? '<span class="badge-hiring">Hiring</span>' : ""}
            </div>
          </div>
        </div>

        <div class="drawer-section drawer-section-wave">
          <p class="drawer-section-label">Wave</p>
          <p class="drawer-wave-line"><span class="wave-code">${escapeHtml(
            wave ? wave.label : company.waveLabel,
          )}</span> · ${escapeHtml(wave ? wave.name : company.waveName)}</p>
          ${wave ? `<p class="drawer-wave-summary">${escapeHtml(wave.summary)}</p>` : ""}
        </div>

        <div class="drawer-section drawer-section-text">
          <p class="drawer-section-label">YC one-liner</p>
          <p class="drawer-oneliner">${escapeHtml(company.oneLiner || "No YC one-liner available.")}</p>
        </div>

        ${
          company.longDescription
            ? `
        <div class="drawer-section drawer-section-text">
          <p class="drawer-section-label">YC description</p>
          <p class="drawer-longdesc">${escapeHtml(company.longDescription)}</p>
        </div>`
            : ""
        }

        ${
          founders
            ? `
        <div class="drawer-section">
          <p class="drawer-section-label">Founders from YC</p>
          <div class="founder-list">${founders}</div>
        </div>`
            : ""
        }

        <div class="drawer-section">
          <p class="drawer-section-label">Details</p>
          <div class="detail-grid">${detailItems}</div>
        </div>

        <div class="drawer-section">
          <p class="drawer-section-label">Theme signals</p>
          <div class="signal-list">${themeDetails}</div>
        </div>

        <div class="drawer-section">
          <p class="drawer-section-label">Links</p>
          <div class="drawer-links">${links}</div>
        </div>
      </div>`;
  }

  function openDrawer(companyId) {
    const company = byId[companyId];
    if (!company) return;
    state.selectedId = companyId;
    hideTooltip();
    els.drawerContent.innerHTML = drawerHtml(company);
    els.drawer.classList.add("is-open");
    els.drawer.setAttribute("aria-hidden", "false");
    els.scrim.classList.add("is-visible");
    els.drawer.scrollTop = 0;
  }

  function closeDrawer() {
    if (state.selectedId == null) return;
    state.selectedId = null;
    els.drawer.classList.remove("is-open");
    els.drawer.setAttribute("aria-hidden", "true");
    els.scrim.classList.remove("is-visible");
  }

  /* Wave rail — click or drag to jump between timeline waves */

  let visibleWaveIds = [];

  function railOffset() {
    return els.controls.offsetHeight + 12;
  }

  function renderRail(visibleWaves) {
    visibleWaveIds = visibleWaves.map((wave) => wave.id);
    els.waveRail.innerHTML = visibleWaves
      .map(
        (wave) => `
          <button type="button" class="wave-rail-node" data-wave-target="${escapeHtml(wave.id)}"
            aria-label="Jump to ${escapeHtml(wave.label)} · ${escapeHtml(wave.name)}">
            <span class="wave-rail-dot"></span>
            <span class="wave-rail-label">${escapeHtml(wave.label)}</span>
          </button>`,
      )
      .join("");
    updateRailVisibility();
    syncRailActive();
  }

  function updateRailVisibility() {
    els.waveRail.hidden = state.view !== "timeline" || visibleWaveIds.length < 2;
  }

  function setRailActive(waveId) {
    Array.from(els.waveRail.children).forEach((node) => {
      node.classList.toggle("is-active", node.dataset.waveTarget === waveId);
    });
  }

  function waveBlockFor(waveId) {
    return els.timeline.querySelector(`.wave-block[data-wave-id="${waveId}"]`);
  }

  function syncRailActive() {
    if (els.waveRail.hidden) return;
    const threshold = railOffset() + 8;
    let current = visibleWaveIds[0];
    for (const waveId of visibleWaveIds) {
      const block = waveBlockFor(waveId);
      if (block && block.getBoundingClientRect().top <= threshold) {
        current = waveId;
      }
    }
    setRailActive(current);
  }

  function jumpToWave(waveId, smooth) {
    const block = waveBlockFor(waveId);
    if (!block) return;
    const top = block.getBoundingClientRect().top + window.scrollY - railOffset() + 2;
    try {
      window.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
    } catch {
      window.scrollTo(0, Math.max(0, top));
    }
    setRailActive(waveId);
  }

  /* Render pipeline */

  function renderViews() {
    const rows = filteredCompanies();
    renderSummary(rows);
    renderResultRow(rows);
    renderTimeline(rows);
    renderCategory(rows);
    renderTable(rows);
  }

  function setView(view) {
    state.view = view;
    els.tabs.forEach((tab) => {
      const isActive = tab.dataset.view === view;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });
    Object.entries(els.panels).forEach(([key, panel]) => {
      panel.classList.toggle("is-active", key === view);
    });
    updateRailVisibility();
    syncRailActive();
  }

  /* Events */

  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setView(tab.dataset.view));
  });

  let searchTimer;
  els.searchInput.addEventListener("input", (event) => {
    const value = event.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = value;
      renderViews();
    }, 120);
  });

  els.filters.forEach((filter) => {
    filter.addEventListener("click", (event) => event.stopPropagation());
  });

  Object.entries(els.filterButtons).forEach(([kind, button]) => {
    button.addEventListener("click", () => {
      state.openMenu = state.openMenu === kind ? "" : kind;
      renderFilters();
    });
  });

  Object.values(els.filterMenus).forEach((menu) => {
    menu.addEventListener("change", (event) => {
      const input = event.target;
      if (input.type !== "checkbox") return;
      const key = filterStateKey[input.dataset.filter];
      const set = new Set(state[key]);
      if (input.checked) {
        set.add(input.value);
      } else {
        set.delete(input.value);
      }
      state[key] = Array.from(set);
      renderFilters();
      renderViews();
    });
    menu.addEventListener("click", (event) => {
      const clear = event.target.closest(".filter-clear");
      if (!clear) return;
      state[filterStateKey[clear.dataset.filter]] = [];
      renderFilters();
      renderViews();
    });
  });

  document.addEventListener("click", () => {
    if (!state.openMenu) return;
    state.openMenu = "";
    renderFilters();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (state.openMenu) {
      state.openMenu = "";
      renderFilters();
    }
    closeDrawer();
  });

  els.clearAll.addEventListener("click", () => {
    state.waves = [];
    state.themes = [];
    state.regions = [];
    state.statuses = [];
    state.search = "";
    els.searchInput.value = "";
    renderFilters();
    renderViews();
  });

  els.tableHeads.forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = key;
        state.sortDir = "asc";
      }
      renderTable(filteredCompanies());
    });
  });

  function companyFromEvent(event) {
    const el = event.target.closest("[data-company-id]");
    return el ? byId[el.dataset.companyId] : null;
  }

  [els.timeline, els.categoryGrid, els.tableBody].forEach((container) => {
    container.addEventListener("click", (event) => {
      const company = companyFromEvent(event);
      if (company) openDrawer(company.id);
    });
  });

  [els.timeline, els.categoryGrid].forEach((container) => {
    container.addEventListener("mouseover", (event) => {
      const company = companyFromEvent(event);
      if (company) showTooltip(company, event);
    });
    container.addEventListener("mousemove", positionTooltip);
    // mouseleave doesn't bubble, so emulate per-cloud leave via mouseout.
    container.addEventListener("mouseout", (event) => {
      const cloud = event.target.closest("[data-hoverable]");
      if (!cloud) return;
      if (!event.relatedTarget || !cloud.contains(event.relatedTarget)) hideTooltip();
    });
  });

  els.waveRail.addEventListener("click", (event) => {
    const node = event.target.closest("[data-wave-target]");
    if (node) jumpToWave(node.dataset.waveTarget, true);
  });

  // Dragging along the rail scrubs through waves, like a contacts fast scroller.
  let railDragging = false;
  function railNodeFromY(clientY) {
    let best = null;
    let bestDistance = Infinity;
    els.waveRail.querySelectorAll("[data-wave-target]").forEach((node) => {
      const rect = node.getBoundingClientRect();
      const distance = Math.abs(clientY - (rect.top + rect.height / 2));
      if (distance < bestDistance) {
        bestDistance = distance;
        best = node;
      }
    });
    return best;
  }
  els.waveRail.addEventListener("pointerdown", (event) => {
    railDragging = true;
    if (els.waveRail.setPointerCapture && event.pointerId !== undefined) {
      try {
        els.waveRail.setPointerCapture(event.pointerId);
      } catch {
        /* pointer already released */
      }
    }
    event.preventDefault();
  });
  els.waveRail.addEventListener("pointermove", (event) => {
    if (!railDragging) return;
    const node = railNodeFromY(event.clientY);
    if (node && !node.classList.contains("is-active")) {
      jumpToWave(node.dataset.waveTarget, false);
    }
  });
  ["pointerup", "pointercancel"].forEach((type) =>
    els.waveRail.addEventListener(type, () => {
      railDragging = false;
    }),
  );

  let railScrollTick = false;
  window.addEventListener(
    "scroll",
    () => {
      if (railScrollTick) return;
      railScrollTick = true;
      requestAnimationFrame(() => {
        railScrollTick = false;
        syncRailActive();
      });
    },
    { passive: true },
  );

  els.scrim.addEventListener("click", closeDrawer);
  els.drawerContent.addEventListener("click", (event) => {
    if (event.target.closest(".drawer-close")) closeDrawer();
  });

  // Image error events don't bubble, so catch them in the capture phase and
  // fall back to the initials underneath.
  document.addEventListener(
    "error",
    (event) => {
      const img = event.target;
      if (img instanceof HTMLImageElement && img.closest(".logo")) {
        img.style.display = "none";
      }
    },
    true,
  );

  /* Init */

  renderChrome();
  renderFilters();
  renderViews();
  setView("timeline");
})();
