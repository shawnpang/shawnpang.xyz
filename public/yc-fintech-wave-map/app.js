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
      spreadsheet: document.getElementById("spreadsheetView"),
    },
    searchInput: document.getElementById("searchInput"),
    filters: Array.from(document.querySelectorAll(".filter")),
    filterButtons: {
      wave: document.getElementById("waveFilterButton"),
      theme: document.getElementById("themeFilterButton"),
      status: document.getElementById("statusFilterButton"),
    },
    filterMenus: {
      wave: document.getElementById("waveFilterMenu"),
      theme: document.getElementById("themeFilterMenu"),
      status: document.getElementById("statusFilterMenu"),
    },
    filterValues: {
      wave: document.getElementById("waveFilterValue"),
      theme: document.getElementById("themeFilterValue"),
      status: document.getElementById("statusFilterValue"),
    },
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

  const companies = data.companies.map((company) => ({
    ...company,
    themesText: (company.themes || [])
      .map((themeId) => (themeMap[themeId] ? themeMap[themeId].label : themeId))
      .join(", "),
  }));
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

  const filterOptions = {
    wave: () =>
      data.waves.map((wave) => ({
        value: wave.id,
        label: `${wave.label} · ${wave.name}`,
      })),
    theme: () => data.themes.map((theme) => ({ value: theme.id, label: theme.label })),
    status: () => statusList.map((status) => ({ value: status, label: status })),
  };
  const filterStateKey = { wave: "waves", theme: "themes", status: "statuses" };
  const filterAllLabel = { wave: "All waves", theme: "All themes", status: "All statuses" };
  const filterNoun = { wave: "waves", theme: "themes", status: "statuses" };

  function renderFilters() {
    ["wave", "theme", "status"].forEach((kind) => {
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
      state.waves.length || state.themes.length || state.statuses.length || state.search.trim(),
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
          <article class="wave-block">
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
