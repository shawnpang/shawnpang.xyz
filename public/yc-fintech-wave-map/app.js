(function () {
  const data = window.YC_FINTECH_WAVE_MAP_DATA;
  const companies = data.companies.map((company) => ({
    ...company,
    themesText: company.themes
      .map((themeId) => themeById(themeId)?.label || themeId)
      .join(", "),
  }));

  const state = {
    view: "timeline",
    search: "",
    waves: [],
    themes: [],
    statuses: [],
    sortKey: "year",
    sortDir: "asc",
  };

  const els = {
    metaStrip: document.getElementById("metaStrip"),
    summaryBand: document.getElementById("summaryBand"),
    footerSource: document.getElementById("footerSource"),
    tabs: Array.from(document.querySelectorAll(".view-tab")),
    searchInput: document.getElementById("searchInput"),
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
    tooltip: document.getElementById("tooltip"),
    drawer: document.getElementById("drawer"),
    drawerContent: document.getElementById("drawerContent"),
    drawerClose: document.getElementById("drawerClose"),
    scrim: document.getElementById("scrim"),
  };

  function themeById(id) {
    return data.themes.find((theme) => theme.id === id);
  }

  function waveById(id) {
    return data.waves.find((wave) => wave.id === id);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function pct(numerator, denominator) {
    if (!denominator) return "0.0%";
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  }

  function initials(name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function logoHtml(company, size = "small") {
    const content = company.logo
      ? `<img src="${escapeHtml(company.logo)}" alt="" loading="lazy" />`
      : escapeHtml(initials(company.name));
    return `<span class="logo logo-${size}">${content}</span>`;
  }

  function statusClass(status) {
    return `status-${String(status || "").toLowerCase()}`;
  }

  function statusPill(status) {
    return `<span class="status-pill ${statusClass(status)}">${escapeHtml(status)}</span>`;
  }

  function themeColor(themeId) {
    return themeById(themeId)?.color || "#0f8b8d";
  }

  function themeChips(company) {
    if (!company.themes.length) return `<span class="chip">Unclassified</span>`;
    return company.themes
      .map((themeId) => {
        const theme = themeById(themeId);
        return `<span class="theme-chip" style="--theme-color:${themeColor(themeId)}">${escapeHtml(theme?.label || themeId)}</span>`;
      })
      .join("");
  }

  function searchable(company) {
    return [
      company.name,
      company.year,
      company.batch,
      company.status,
      company.subindustry,
      company.oneLiner,
      company.longDescription,
      (company.founders || [])
        .map((founder) =>
          [
            founder.name,
            founder.title,
            founder.linkedinUrl,
            founder.xUrl,
          ].join(" "),
        )
        .join(" "),
      company.tags.join(" "),
      company.themesText,
      company.auditEvidence.join(" "),
      company.locations,
      company.regions.join(" "),
    ]
      .join(" ")
      .toLowerCase();
  }

  function filteredCompanies() {
    const query = state.search.trim().toLowerCase();
    return companies.filter((company) => {
      if (state.waves.length && !state.waves.includes(company.wave)) return false;
      if (state.themes.length && !company.themes.some((theme) => state.themes.includes(theme))) {
        return false;
      }
      if (state.statuses.length && !state.statuses.includes(company.status)) return false;
      if (query && !searchable(company).includes(query)) return false;
      return true;
    });
  }

  function filterConfigs() {
    const statuses = Array.from(new Set(companies.map((company) => company.status))).sort();
    return {
      wave: {
        allLabel: "All waves",
        itemName: "wave",
        stateKey: "waves",
        items: data.waves.map((wave) => ({
          value: wave.id,
          label: `${wave.label} - ${wave.name}`,
        })),
      },
      theme: {
        allLabel: "All themes",
        itemName: "theme",
        stateKey: "themes",
        items: data.themes.map((theme) => ({
          value: theme.id,
          label: theme.label,
        })),
      },
      status: {
        allLabel: "All statuses",
        itemName: "status",
        stateKey: "statuses",
        items: statuses.map((status) => ({
          value: status,
          label: status,
        })),
      },
    };
  }

  function setFilterOptions() {
    const configs = filterConfigs();
    Object.entries(configs).forEach(([filter, config]) => {
      const menu = els.filterMenus[filter];
      menu.innerHTML = [
        `<button class="filter-clear" type="button" data-filter="${filter}">${escapeHtml(config.allLabel)}</button>`,
        `<div class="filter-options">`,
        ...config.items.map(
          (item) => `
            <label class="filter-option">
              <input type="checkbox" data-filter="${filter}" value="${escapeHtml(item.value)}" />
              <span>${escapeHtml(item.label)}</span>
            </label>
          `,
        ),
        `</div>`,
      ].join("");
    });
    syncFilterControls();
  }

  function syncFilterControls() {
    const configs = filterConfigs();
    Object.entries(configs).forEach(([filter, config]) => {
      const selected = state[config.stateKey];
      const selectedLabels = config.items
        .filter((item) => selected.includes(item.value))
        .map((item) => item.label);
      const label =
        selected.length === 0
          ? config.allLabel
          : selected.length === 1
            ? selectedLabels[0]
            : `${selected.length} ${config.itemName}s`;
      els.filterValues[filter].textContent = label;
      Array.from(els.filterMenus[filter].querySelectorAll("input[type='checkbox']")).forEach(
        (input) => {
          input.checked = selected.includes(input.value);
        },
      );
    });
  }

  function setFilterSelection(filter, value, checked) {
    const config = filterConfigs()[filter];
    if (!config) return;
    const current = new Set(state[config.stateKey]);
    if (checked) {
      current.add(value);
    } else {
      current.delete(value);
    }
    state[config.stateKey] = Array.from(current);
    syncFilterControls();
    render();
  }

  function clearFilterSelection(filter) {
    const config = filterConfigs()[filter];
    if (!config) return;
    state[config.stateKey] = [];
    syncFilterControls();
    render();
  }

  function closeFilterMenus(exceptFilter) {
    Object.entries(els.filterMenus).forEach(([filter, menu]) => {
      const isOpen = filter === exceptFilter;
      menu.classList.toggle("is-open", isOpen);
      els.filterButtons[filter].setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  function renderMeta() {
    const generated = data.meta.generatedAt
      ? new Date(data.meta.generatedAt).toISOString().slice(0, 10)
      : "unknown";
    els.metaStrip.innerHTML = [
      `<span class="meta-pill">${data.meta.companyCount} companies</span>`,
      `<span class="meta-pill">YC status only</span>`,
      `<span class="meta-pill">Updated ${generated}</span>`,
    ].join("");
  }

  function renderFooterSource() {
    if (!els.footerSource) return;
    const updated = data.meta.generatedAt || "unknown";
    const ycApi = data.meta.ycApi || "https://yc-oss.github.io/api/companies/all.json";
    els.footerSource.innerHTML = `
      <strong>Source data:</strong>
      YC public company data from
      <a href="${escapeHtml(ycApi)}" target="_blank" rel="noreferrer">yc-oss companies/all.json</a>
      and YC metadata from
      <a href="https://yc-oss.github.io/api/meta.json" target="_blank" rel="noreferrer">meta.json</a>.
      YC API last_updated: <code>${escapeHtml(updated)}</code>.
      Founder LinkedIn/X links are parsed only from public YC directory company pages; no social profiles are inferred.
    `;
  }

  function renderSummary(rows) {
    const active = rows.filter((company) => company.status === "Active").length;
    const ai = rows.filter((company) => company.themes.includes("ai-native-finance")).length;
    const payments = rows.filter((company) => company.isPayments).length;
    const stablecoins = rows.filter((company) => company.isStablecoin).length;
    els.summaryBand.innerHTML = [
      metric(rows.length, "matching companies"),
      metric(pct(active, rows.length), "active by YC status"),
      metric(pct(ai, rows.length), "AI-native finance signal"),
      metric(pct(payments, rows.length), "payments tag or subindustry"),
      metric(stablecoins, "product-level stablecoin"),
    ].join("");
  }

  function metric(value, label) {
    return `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
  }

  function topThemeStats(rows, limit = 4) {
    const counts = new Map();
    rows.forEach((company) => {
      company.themes.forEach((themeId) => {
        counts.set(themeId, (counts.get(themeId) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  function renderTimeline(rows) {
    const rowsByWave = new Map(data.waves.map((wave) => [wave.id, []]));
    rows.forEach((company) => rowsByWave.get(company.wave)?.push(company));

    const visibleWaves = data.waves.filter(
      (wave) => !state.waves.length || state.waves.includes(wave.id),
    );

    els.timeline.innerHTML = visibleWaves
      .map((wave) => {
        const waveRows = rowsByWave.get(wave.id) || [];
        const aiCount = waveRows.filter((company) =>
          company.themes.includes("ai-native-finance"),
        ).length;
        const topThemes = topThemeStats(waveRows, 3)
          .map(([themeId, count]) => {
            const theme = themeById(themeId);
            return `<span class="chip" style="border-color:${themeColor(themeId)}">${escapeHtml(theme?.label || themeId)} ${count}</span>`;
          })
          .join("");
        return `
          <article class="wave-row">
            <div class="wave-heading">
              <h2>${escapeHtml(wave.label)}: ${escapeHtml(wave.name)}</h2>
              <p>${escapeHtml(wave.summary)}</p>
              <div class="wave-stats">
                <span class="chip">${waveRows.length} companies</span>
                <span class="chip">${pct(aiCount, waveRows.length)} AI signal</span>
                ${topThemes}
              </div>
            </div>
            <div class="company-cloud">
              ${waveRows.length ? waveRows.map(companyCard).join("") : emptyState("No companies match these filters.")}
            </div>
          </article>
        `;
      })
      .join("");
    attachCompanyEvents(els.timeline);
  }

  function renderCategory(rows) {
    const selectedThemes =
      state.themes.length
        ? data.themes.filter((theme) => state.themes.includes(theme.id))
        : data.themes;
    const maxWaveCount = Math.max(
      1,
      ...selectedThemes.map((theme) =>
        Math.max(
          0,
          ...data.waves.map(
            (wave) =>
              rows.filter(
                (company) => company.wave === wave.id && company.themes.includes(theme.id),
              ).length,
          ),
        ),
      ),
    );

    els.categoryGrid.innerHTML = selectedThemes
      .map((theme) => {
        const themeRows = rows.filter((company) => company.themes.includes(theme.id));
        const keywordCounts = new Map();
        themeRows.forEach((company) => {
          (company.themeHits[theme.id] || []).forEach((keyword) => {
            keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
          });
        });
        const keywords = Array.from(keywordCounts.entries())
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 6)
          .map(([keyword, count]) => `<span class="chip">${escapeHtml(keyword)} ${count}</span>`)
          .join("");

        const bars = data.waves
          .map((wave) => {
            const count = themeRows.filter((company) => company.wave === wave.id).length;
            const width = Math.max(2, (count / maxWaveCount) * 100);
            return `
              <div class="mini-bar">
                <span>${escapeHtml(wave.label)}</span>
                <span class="mini-bar-track"><span class="mini-bar-fill" style="width:${width}%"></span></span>
                <strong>${count}</strong>
              </div>
            `;
          })
          .join("");

        return `
          <article class="category-card" style="--theme-color:${escapeHtml(theme.color)}">
            <h2>${escapeHtml(theme.label)}</h2>
            <p>${themeRows.length} matching companies across the selected filters.</p>
            <div class="category-meta">${keywords || `<span class="chip">No keyword hits</span>`}</div>
            <div class="mini-bars">${bars}</div>
            <div class="company-cloud">
              ${themeRows.length ? themeRows.map(companyCard).join("") : emptyState("No companies in this category.")}
            </div>
          </article>
        `;
      })
      .join("");
    attachCompanyEvents(els.categoryGrid);
  }

  function renderSpreadsheet(rows) {
    const sorted = [...rows].sort((a, b) => {
      const key = state.sortKey;
      const aValue = a[key] ?? "";
      const bValue = b[key] ?? "";
      let result;
      if (typeof aValue === "number" && typeof bValue === "number") {
        result = aValue - bValue;
      } else {
        result = String(aValue).localeCompare(String(bValue), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }
      return state.sortDir === "asc" ? result : -result;
    });

    els.tableBody.innerHTML = sorted
      .map(
        (company) => `
          <tr data-company-id="${escapeHtml(company.id)}" tabindex="0">
            <td>
              <div class="table-company">
                ${logoHtml(company)}
                <div>
                  <strong>${escapeHtml(company.name)}</strong>
                  <div class="table-one-liner">${escapeHtml(company.oneLiner || "No YC one-liner")}</div>
                </div>
              </div>
            </td>
            <td>${company.year}</td>
            <td>${escapeHtml(company.waveLabel)}</td>
            <td>${statusPill(company.status)}</td>
            <td>${escapeHtml(company.subindustry)}</td>
            <td>${themeChips(company)}</td>
          </tr>
        `,
      )
      .join("");

    Array.from(els.tableBody.querySelectorAll("tr")).forEach((row) => {
      row.addEventListener("click", () => openDrawer(companyById(row.dataset.companyId)));
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDrawer(companyById(row.dataset.companyId));
        }
      });
    });
  }

  function companyCard(company) {
    const firstTheme = company.themes[0] || "payments-money-movement";
    const theme = themeById(firstTheme);
    return `
      <button
        class="company-card"
        type="button"
        data-company-id="${escapeHtml(company.id)}"
        style="--theme-color:${themeColor(firstTheme)}"
        aria-label="${escapeHtml(company.name)} details"
      >
        ${logoHtml(company)}
        <span>
          <span class="company-name">${escapeHtml(company.name)}</span>
          <span class="company-sub">
            <span>${company.year}</span>
            ${statusPill(company.status)}
            <span>${escapeHtml(theme?.label || "Theme")}</span>
          </span>
        </span>
      </button>
    `;
  }

  function emptyState(text) {
    return `<div class="empty-state">${escapeHtml(text)}</div>`;
  }

  function companyById(id) {
    return companies.find((company) => company.id === String(id));
  }

  function attachCompanyEvents(root) {
    Array.from(root.querySelectorAll("[data-company-id]")).forEach((node) => {
      const company = companyById(node.dataset.companyId);
      if (!company) return;
      node.addEventListener("mouseenter", (event) => showTooltip(company, event));
      node.addEventListener("mousemove", (event) => moveTooltip(event));
      node.addEventListener("mouseleave", hideTooltip);
      node.addEventListener("focus", (event) => showTooltip(company, event));
      node.addEventListener("blur", hideTooltip);
      node.addEventListener("click", () => openDrawer(company));
    });
  }

  function showTooltip(company, event) {
    const firstTheme = company.themes[0];
    const keywordText = firstTheme
      ? (company.themeHits[firstTheme] || []).slice(0, 4).join(", ")
      : "";
    const founderText = (company.founders || [])
      .slice(0, 3)
      .map((founder) => founder.name)
      .filter(Boolean)
      .join(", ");
    els.tooltip.innerHTML = `
      <div class="tooltip-inner">
        <div class="tooltip-title">
          <span>${escapeHtml(company.name)}</span>
          ${statusPill(company.status)}
        </div>
        <p>${escapeHtml(company.oneLiner || company.subindustry || "No YC one-liner")}</p>
        ${founderText ? `<p>Founders: ${escapeHtml(founderText)}</p>` : ""}
        <div>${themeChips(company)}</div>
        ${keywordText ? `<p>Keywords: ${escapeHtml(keywordText)}</p>` : ""}
      </div>
    `;
    els.tooltip.classList.add("is-visible");
    moveTooltip(event);
  }

  function moveTooltip(event) {
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

  function openDrawer(company) {
    if (!company) return;
    hideTooltip();
    const wave = waveById(company.wave);
    const founders = company.founders || [];
    const themeDetails = company.themes
      .map((themeId) => {
        const theme = themeById(themeId);
        const hits = company.themeHits[themeId] || [];
        return `
          <div class="detail-item">
            <span style="color:${themeColor(themeId)}">${escapeHtml(theme?.label || themeId)}</span>
            ${escapeHtml(hits.join(", ") || "Theme match")}
          </div>
        `;
      })
      .join("");

    const links = [
      company.website
        ? `<a class="link-button" href="${escapeHtml(company.website)}" target="_blank" rel="noreferrer">Website</a>`
        : "",
      company.ycUrl
        ? `<a class="link-button secondary" href="${escapeHtml(company.ycUrl)}" target="_blank" rel="noreferrer">YC directory</a>`
        : "",
      `<a class="link-button secondary" href="${escapeHtml(company.linkedinSearch)}" target="_blank" rel="noreferrer">LinkedIn search</a>`,
      `<a class="link-button secondary" href="${escapeHtml(company.xSearch)}" target="_blank" rel="noreferrer">X search</a>`,
    ]
      .filter(Boolean)
      .join("");
    const founderCards = founders
      .map((founder) => {
        const founderLinks = [
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
          <div class="founder-card">
            <div>
              <strong>${escapeHtml(founder.name || "Founder")}</strong>
              ${founder.title ? `<span>${escapeHtml(founder.title)}</span>` : ""}
            </div>
            <div class="founder-links">${founderLinks || `<span>No YC social link</span>`}</div>
          </div>
        `;
      })
      .join("");

    els.drawerContent.innerHTML = `
      <div class="drawer-hero">
        ${logoHtml(company, "large")}
        <div>
          <h2>${escapeHtml(company.name)}</h2>
          <div class="company-sub">
            <span>${escapeHtml(company.batch)}</span>
            ${statusPill(company.status)}
            ${company.topCompany ? `<span class="chip">Top company</span>` : ""}
            ${company.isHiring ? `<span class="chip">Hiring</span>` : ""}
          </div>
        </div>
      </div>
      <div class="drawer-section">
        <h3>Wave</h3>
        <p><strong>${escapeHtml(wave?.label || company.waveLabel)}: ${escapeHtml(wave?.name || company.waveName)}</strong></p>
        <p>${escapeHtml(wave?.summary || "")}</p>
      </div>
      <div class="drawer-section">
        <h3>YC one-liner</h3>
        <p>${escapeHtml(company.oneLiner || "No YC one-liner available.")}</p>
      </div>
      ${
        company.longDescription
          ? `<div class="drawer-section"><h3>YC description</h3><p>${escapeHtml(company.longDescription)}</p></div>`
          : ""
      }
      ${
        founders.length
          ? `<div class="drawer-section"><h3>Founders from YC</h3><div class="founder-list">${founderCards}</div></div>`
          : ""
      }
      <div class="drawer-section">
        <h3>Details</h3>
        <div class="detail-grid">
          <div class="detail-item"><span>Subindustry</span>${escapeHtml(company.subindustry || "Unknown")}</div>
          <div class="detail-item"><span>Team size</span>${escapeHtml(company.teamSize || "Unknown")}</div>
          <div class="detail-item"><span>Location</span>${escapeHtml(company.locations || "Unknown")}</div>
          <div class="detail-item"><span>Stage</span>${escapeHtml(company.stage || "Unknown")}</div>
          <div class="detail-item"><span>Payments flag</span>${company.isPayments ? "Yes" : "No"}</div>
          <div class="detail-item"><span>Stablecoin flag</span>${company.isStablecoin ? "Yes" : "No"}</div>
        </div>
      </div>
      <div class="drawer-section">
        <h3>Theme keywords</h3>
        <div class="detail-grid">${themeDetails || `<div class="detail-item">No theme keywords matched.</div>`}</div>
      </div>
      <div class="drawer-section">
        <h3>Audit evidence</h3>
        <p>${escapeHtml(company.auditEvidence.join("; ") || company.cleanScope)}</p>
      </div>
      <div class="drawer-section">
        <h3>Sources and links</h3>
        <div class="link-row">${links}</div>
      </div>
    `;
    els.drawer.classList.add("is-open");
    els.scrim.classList.add("is-visible");
    els.drawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    els.drawer.classList.remove("is-open");
    els.scrim.classList.remove("is-visible");
    els.drawer.setAttribute("aria-hidden", "true");
  }

  function switchView(view) {
    state.view = view;
    els.tabs.forEach((tab) => {
      const active = tab.dataset.view === view;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll(".view-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === `${view}View`);
    });
    render();
  }

  function render() {
    const rows = filteredCompanies();
    renderSummary(rows);
    if (state.view === "timeline") renderTimeline(rows);
    if (state.view === "category") renderCategory(rows);
    if (state.view === "spreadsheet") renderSpreadsheet(rows);
  }

  function bindEvents() {
    els.tabs.forEach((tab) => {
      tab.addEventListener("click", () => switchView(tab.dataset.view));
    });
    els.searchInput.addEventListener("input", (event) => {
      state.search = event.target.value;
      render();
    });
    Object.entries(els.filterButtons).forEach(([filter, button]) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = button.getAttribute("aria-expanded") !== "true";
        closeFilterMenus(willOpen ? filter : undefined);
      });
    });
    Object.entries(els.filterMenus).forEach(([filter, menu]) => {
      menu.addEventListener("click", (event) => {
        event.stopPropagation();
        const clearButton = event.target.closest(".filter-clear");
        if (clearButton) {
          clearFilterSelection(filter);
        }
      });
      menu.addEventListener("change", (event) => {
        if (event.target.matches("input[type='checkbox']")) {
          setFilterSelection(filter, event.target.value, event.target.checked);
        }
      });
    });
    els.tableHeads.forEach((head) => {
      head.addEventListener("click", () => {
        const key = head.dataset.sort;
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortKey = key;
          state.sortDir = "asc";
        }
        renderSpreadsheet(filteredCompanies());
      });
    });
    els.drawerClose.addEventListener("click", closeDrawer);
    els.scrim.addEventListener("click", closeDrawer);
    document.addEventListener("click", () => closeFilterMenus());
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeFilterMenus();
      if (event.key === "Escape") closeDrawer();
    });
  }

  function init() {
    setFilterOptions();
    renderMeta();
    renderFooterSource();
    bindEvents();
    render();
  }

  init();
})();
