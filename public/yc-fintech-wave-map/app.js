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
    locationMapWrap: document.getElementById("locationMapWrap"),
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
    "United States": "USA",
  };

  // Display coordinates (lat, lng) for every normalized location key in the
  // dataset. State/region keys use centroids; country-only keys use the
  // country's geographic center. A key missing here (e.g. after a data
  // refresh) is reported under the map instead of breaking it.
  const CITY_COORDS = {
    "San Francisco, CA, USA": [37.7749, -122.4194],
    "New York, NY, USA": [40.7128, -74.006],
    "Bengaluru, KA, India": [12.9716, 77.5946],
    "London, United Kingdom": [51.5074, -0.1278],
    "Mexico City, CDMX, Mexico": [19.4326, -99.1332],
    "Lagos, Nigeria": [6.5244, 3.3792],
    Singapore: [1.3521, 103.8198],
    "São Paulo, SP, Brazil": [-23.5505, -46.6333],
    "Los Angeles, CA, USA": [34.0522, -118.2437],
    "Miami, FL, USA": [25.7617, -80.1918],
    "Jakarta, Indonesia": [-6.2088, 106.8456],
    "Palo Alto, CA, USA": [37.4419, -122.143],
    "Austin, TX, USA": [30.2672, -97.7431],
    "Mountain View, CA, USA": [37.3861, -122.0839],
    "Boston, MA, USA": [42.3601, -71.0589],
    "Maharashtra, India": [19.7515, 75.7139],
    "Paris, Île-de-France, France": [48.8566, 2.3522],
    "Bogotá, Bogota, Colombia": [4.711, -74.0721],
    "Dubai, United Arab Emirates": [25.2048, 55.2708],
    "Toronto, ON, Canada": [43.6532, -79.3832],
    "Oakland, CA, USA": [37.8044, -122.2712],
    "Gurugram, HR, India": [28.4595, 77.0266],
    "Nairobi, Nairobi County, Kenya": [-1.2921, 36.8219],
    "Santiago, Santiago Metropolitan Region, Chile": [-33.4489, -70.6693],
    "Chicago, IL, USA": [41.8781, -87.6298],
    "Tel Aviv-Yafo, Tel Aviv District, Israel": [32.0853, 34.7818],
    "Cairo, Cairo Governorate, Egypt": [30.0444, 31.2357],
    "Buenos Aires, CABA, Argentina": [-34.6037, -58.3816],
    "Monterrey, N.L., Mexico": [25.6866, -100.3161],
    "Atlanta, GA, USA": [33.749, -84.388],
    "Sindh, Pakistan": [25.8943, 68.5247],
    "Delhi, DL, India": [28.7041, 77.1025],
    "Seattle, WA, USA": [47.6062, -122.3321],
    "Santa Clara, CA, USA": [37.3541, -121.9552],
    "Redwood City, CA, USA": [37.4852, -122.2364],
    "Dakar, Dakar Region, Senegal": [14.7167, -17.4677],
    "Berkeley, CA, USA": [37.8715, -122.273],
    "San Diego, CA, USA": [32.7157, -117.1611],
    "Dallas, TX, USA": [32.7767, -96.797],
    "Lima, Peru": [-12.0464, -77.0428],
    "Panama City, Panama": [8.9824, -79.5199],
    "Minneapolis, MN, USA": [44.9778, -93.265],
    "New Delhi, DL, India": [28.6139, 77.209],
    "Copenhagen, Denmark": [55.6761, 12.5683],
    "Seoul, South Korea": [37.5665, 126.978],
    "Barcelona, CT, Spain": [41.3851, 2.1734],
    "Delaware City, DE, USA": [39.5779, -75.5891],
    "Ho Chi Minh City, Vietnam": [10.8231, 106.6297],
    "Hyderabad, Telangana, India": [17.385, 78.4867],
    "Hanoi, Vietnam": [21.0278, 105.8342],
    "Islamabad, Islamabad Capital Territory, Pakistan": [33.6844, 73.0479],
    "Riyadh, Riyadh Province, Saudi Arabia": [24.7136, 46.6753],
    "Wilmington, DE, USA": [39.7391, -75.5398],
    "Sydney, NSW, Australia": [-33.8688, 151.2093],
    "Redmond, WA, USA": [47.674, -122.1215],
    "Culver City, CA, USA": [34.0211, -118.3965],
    "Ottawa, ON, Canada": [45.4215, -75.6972],
    "Waterloo, ON, Canada": [43.4643, -80.5204],
    "South San Francisco, CA, USA": [37.6547, -122.4077],
    "Sterling, VA, USA": [39.0062, -77.4286],
    "Troy, MI, USA": [42.6064, -83.1498],
    "Emeryville, CA, USA": [37.8313, -122.2852],
    "McLean, VA, USA": [38.9339, -77.1773],
    "Pittsburgh, PA, USA": [40.4406, -79.9959],
    "Silver Spring, MD, USA": [38.9907, -77.0261],
    "Distrito Federal, Brazil": [-15.7998, -47.8645],
    USA: [39.8283, -98.5795],
    "Sunnyvale, CA, USA": [37.3688, -122.0363],
    "England, United Kingdom": [52.3555, -1.1743],
    "Denver, CO, USA": [39.7392, -104.9903],
    "San Mateo, CA, USA": [37.563, -122.3255],
    Seychelles: [-4.6191, 55.4513],
    "Taguig, NCR, Philippines": [14.5176, 121.0509],
    "Cali, Valle del Cauca, Colombia": [3.4516, -76.532],
    "Louisville, KY, USA": [38.2527, -85.7585],
    "Abuja, Federal Capital Territory, Nigeria": [9.0765, 7.3986],
    "Little Rock, AR, USA": [34.7465, -92.2896],
    "Minas Gerais, Brazil": [-18.5122, -44.555],
    "Haryana, India": [29.0588, 76.0856],
    "Williamsburg, VA, USA": [37.2707, -76.7075],
    "Accra, Greater Accra Region, Ghana": [5.6037, -0.187],
    "Vancouver, BC, Canada": [49.2827, -123.1207],
    "Abidjan, Abidjan Autonomous District, Ivory Coast": [5.36, -4.0083],
    "Honolulu, HI, USA": [21.3099, -157.8581],
    "Cape Town, WC, South Africa": [-33.9249, 18.4241],
    "San Jose, CA, USA": [37.3382, -121.8863],
    "Manila, NCR, Philippines": [14.5995, 120.9842],
    "Santa Monica, CA, USA": [34.0195, -118.4912],
    "Windhoek, Khomas Region, Namibia": [-22.5609, 17.0658],
    "Birmingham, England, United Kingdom": [52.4862, -1.8904],
    "Nuevo León, Mexico": [25.5922, -99.9962],
    "Rio de Janeiro, RJ, Brazil": [-22.9068, -43.1729],
    "Kochi, KL, India": [9.9312, 76.2673],
    "Makati, NCR, Philippines": [14.5547, 121.0244],
    "Tbilisi, Georgia": [41.7151, 44.8271],
    "Provo, UT, USA": [40.2338, -111.6585],
    "Tallinn, Harju County, Estonia": [59.437, 24.7536],
    "Karachi, Sindh, Pakistan": [24.8607, 67.0011],
    "Lusaka, Lusaka Province, Zambia": [-15.3875, 28.3228],
    "Navi Mumbai, MH, India": [19.033, 73.0297],
    "Manama, Capital Governorate, Bahrain": [26.2285, 50.586],
    "San José, San José Province, Costa Rica": [9.9281, -84.0907],
    "Manaus, AM, Brazil": [-3.119, -60.0217],
    "Claymont, DE, USA": [39.8007, -75.4596],
    "Mumbai, MH, India": [19.076, 72.8777],
    "Kampala, Central Region, Uganda": [0.3476, 32.5825],
    "Catalonia, Spain": [41.5912, 1.5209],
    "Kitchener, ON, Canada": [43.4516, -80.4925],
    "Madrid, Community of Madrid, Spain": [40.4168, -3.7038],
    "Fredericton, NB, Canada": [45.9636, -66.6431],
    "Salt Lake City, UT, USA": [40.7608, -111.891],
    "Norwalk, CT, USA": [41.1177, -73.4082],
    "Córdoba, Cordoba, Argentina": [-31.4201, -64.1888],
    "Surat, GJ, India": [21.1702, 72.8311],
    "Aspen, CO, USA": [39.1911, -106.8175],
    "Medellín, Antioquia, Colombia": [6.2476, -75.5658],
    "Kinshasa, Democratic Republic of the Congo": [-4.4419, 15.2663],
    "Montreal, QC, Canada": [45.5017, -73.5673],
    "Columbus, OH, USA": [39.9612, -82.9988],
    "Ikeja, LA, Nigeria": [6.6018, 3.3515],
    "Berlin, Germany": [52.52, 13.405],
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

  /* Location map — city bubbles over the projected world in map-geo.js.
     The page works without that file; the view then falls back to cards only. */

  const geoData = window.YC_FINTECH_WAVE_MAP_GEO || null;
  const MAP_MAX_ZOOM = 12;
  const mapState = { zoom: 1, cx: 0, cy: 0, dragMoved: false };
  const mapEls = {};
  let lastLocationEntries = [];

  // Natural Earth I projection — must stay identical to scripts/build-map-geo.mjs,
  // which bakes the same projection into the land path.
  function projectCity(lat, lng) {
    const l = (lng * Math.PI) / 180;
    const p = (lat * Math.PI) / 180;
    const p2 = p * p;
    const p4 = p2 * p2;
    const x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)));
    const y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
    return [geoData.cx + geoData.k * x, geoData.cy - geoData.k * y];
  }

  function graticulePath() {
    const lines = [];
    const polyline = (points) =>
      `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}`;
    for (let lon = -180; lon <= 180; lon += 30) {
      const points = [];
      for (let lat = geoData.latClip; lat <= 84; lat += 2) points.push(projectCity(lat, lon));
      lines.push(polyline(points));
    }
    for (let lat = -40; lat <= 80; lat += 20) {
      const points = [];
      for (let lon = -180; lon <= 180; lon += 3) points.push(projectCity(lat, lon));
      lines.push(polyline(points));
    }
    return lines.join("");
  }

  function buildLocationMap() {
    if (!geoData || !els.locationMapWrap) return;
    els.locationMapWrap.hidden = false;
    els.locationMapWrap.innerHTML = `
      <svg class="map-svg" viewBox="0 0 ${geoData.width} ${geoData.height}" role="img"
        aria-label="World map of company locations; bubble area scales with company count">
        <path class="map-graticule" d="${graticulePath()}" vector-effect="non-scaling-stroke"></path>
        <path class="map-land" d="${geoData.land}" fill-rule="evenodd" vector-effect="non-scaling-stroke"></path>
        <g class="map-bubbles" id="mapBubbles" data-hoverable></g>
        <g class="map-labels" id="mapLabels" aria-hidden="true"></g>
      </svg>
      <div class="map-controls">
        <button type="button" class="map-ctrl" id="mapZoomIn" aria-label="Zoom in">+</button>
        <button type="button" class="map-ctrl" id="mapZoomOut" aria-label="Zoom out">&minus;</button>
        <button type="button" class="map-ctrl map-ctrl-reset" id="mapZoomReset" aria-label="Reset map view">&#10227;</button>
      </div>
      <div class="map-foot" id="mapFoot"></div>`;
    mapEls.svg = els.locationMapWrap.querySelector(".map-svg");
    mapEls.bubbles = document.getElementById("mapBubbles");
    mapEls.labels = document.getElementById("mapLabels");
    mapEls.foot = document.getElementById("mapFoot");
    mapEls.zoomOut = document.getElementById("mapZoomOut");
    mapEls.zoomReset = document.getElementById("mapZoomReset");
    // Lock the element's aspect to the viewBox so client px map 1:1 onto
    // viewBox units (no letterboxing math in clientToMap).
    mapEls.svg.style.aspectRatio = `${geoData.width} / ${geoData.height}`;
    mapState.cx = geoData.width / 2;
    mapState.cy = geoData.height / 2;
    bindMapEvents();
    applyMapView();
  }

  function applyMapView() {
    const viewW = geoData.width / mapState.zoom;
    const viewH = geoData.height / mapState.zoom;
    mapState.cx = Math.min(geoData.width - viewW / 2, Math.max(viewW / 2, mapState.cx));
    mapState.cy = Math.min(geoData.height - viewH / 2, Math.max(viewH / 2, mapState.cy));
    mapEls.svg.setAttribute(
      "viewBox",
      `${(mapState.cx - viewW / 2).toFixed(2)} ${(mapState.cy - viewH / 2).toFixed(2)} ${viewW.toFixed(2)} ${viewH.toFixed(2)}`,
    );
    const zoomed = mapState.zoom > 1.001;
    els.locationMapWrap.classList.toggle("is-zoomed", zoomed);
    // While zoomed the drag pans the map, so claim touch gestures; at world
    // view leave them to the page scroll.
    mapEls.svg.style.touchAction = zoomed ? "none" : "";
    mapEls.zoomOut.disabled = !zoomed;
    mapEls.zoomReset.disabled = !zoomed;
  }

  function setMapZoom(zoom, focusX, focusY) {
    const next = Math.min(MAP_MAX_ZOOM, Math.max(1, zoom));
    if (focusX != null) {
      const ratio = next === 0 ? 1 : mapState.zoom / next;
      mapState.cx = focusX - (focusX - mapState.cx) * ratio;
      mapState.cy = focusY - (focusY - mapState.cy) * ratio;
    }
    const changed = next !== mapState.zoom;
    mapState.zoom = next;
    applyMapView();
    if (changed) renderMapMarkers();
  }

  function clientToMap(event) {
    const rect = mapEls.svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return [mapState.cx, mapState.cy];
    const viewW = geoData.width / mapState.zoom;
    const viewH = geoData.height / mapState.zoom;
    return [
      mapState.cx - viewW / 2 + ((event.clientX - rect.left) / rect.width) * viewW,
      mapState.cy - viewH / 2 + ((event.clientY - rect.top) / rect.height) * viewH,
    ];
  }

  function plottedBubbles() {
    const plotted = [];
    lastLocationEntries.forEach(([key, list]) => {
      const coords = CITY_COORDS[key];
      if (!coords) return;
      const [x, y] = projectCity(coords[0], coords[1]);
      plotted.push({ key, list, x, y, count: list.length });
    });
    return plotted; // keeps the by-count ordering of the entries
  }

  function renderMapMarkers() {
    if (!mapEls.svg) return;
    const plotted = plottedBubbles();

    // If a filter change left every bubble outside the zoomed view (e.g. the
    // user zoomed to the US, then filtered to Africa), snap back to the world.
    if (mapState.zoom > 1.001 && plotted.length) {
      const viewW = geoData.width / mapState.zoom;
      const viewH = geoData.height / mapState.zoom;
      const anyVisible = plotted.some(
        (bubble) =>
          Math.abs(bubble.x - mapState.cx) <= viewW / 2 &&
          Math.abs(bubble.y - mapState.cy) <= viewH / 2,
      );
      if (!anyVisible) {
        mapState.zoom = 1;
        applyMapView();
      }
    }

    const maxCount = plotted.reduce((max, bubble) => Math.max(max, bubble.count), 1);
    // On screen, bubbles grow slowly while zooming (zoom^0.45) and stop at
    // 2.2× their base size (~zoom 5.7), so the cities under a dense cluster
    // spread apart instead of disappearing beneath one giant circle.
    const attenuation = Math.pow(mapState.zoom, 0.55);
    const radius = (count) => {
      const base = 3 + 23 * Math.sqrt(count / maxCount);
      return Math.min(base / attenuation, (2.2 * base) / mapState.zoom);
    };

    mapEls.bubbles.innerHTML = plotted
      .map(
        (bubble) =>
          `<circle class="map-bubble" data-loc-key="${escapeHtml(bubble.key)}" cx="${bubble.x.toFixed(1)}" cy="${bubble.y.toFixed(1)}" r="${radius(bubble.count).toFixed(2)}" vector-effect="non-scaling-stroke"></circle>`,
      )
      .join("");

    const labelLimit =
      mapState.zoom < 1.8 ? 8 : mapState.zoom < 3.2 ? 20 : mapState.zoom < 5.5 ? 48 : plotted.length;
    const fontSize = 11.5 / Math.pow(mapState.zoom, 0.92);
    // Greedy collision pass, biggest city first: a label is dropped rather
    // than drawn over an earlier one (DM Mono advance ≈ 0.62em).
    const placedLabels = [];
    mapEls.labels.innerHTML = plotted
      .slice(0, labelLimit)
      .map((bubble) => {
        const title = cityMeta(bubble.key).title;
        const x = bubble.x + radius(bubble.count) + fontSize * 0.35;
        const rect = {
          left: x,
          right: x + title.length * fontSize * 0.62,
          top: bubble.y - fontSize * 0.55,
          bottom: bubble.y + fontSize * 0.55,
        };
        const collides = placedLabels.some(
          (other) =>
            rect.left < other.right &&
            rect.right > other.left &&
            rect.top < other.bottom &&
            rect.bottom > other.top,
        );
        if (collides) return "";
        placedLabels.push(rect);
        return `<text class="map-label" x="${x.toFixed(1)}" y="${bubble.y.toFixed(1)}" dy="0.35em" font-size="${fontSize.toFixed(2)}" stroke-width="${(fontSize * 0.3).toFixed(2)}">${escapeHtml(title)}</text>`;
      })
      .join("");
  }

  function renderMapFoot() {
    if (!mapEls.foot) return;
    const pills = [];
    ["__remote__", "__unlisted__"].forEach((key) => {
      const entry = lastLocationEntries.find(([entryKey]) => entryKey === key);
      if (!entry) return;
      pills.push(
        `<button type="button" class="map-offmap-pill" data-loc-key="${escapeHtml(key)}">${escapeHtml(cityMeta(key).title)} <strong>${entry[1].length}</strong></button>`,
      );
    });
    const missing = lastLocationEntries.filter(
      ([key]) => !key.startsWith("__") && !CITY_COORDS[key],
    );
    if (missing.length) {
      pills.push(
        `<span class="map-missing">${missing.length} ${missing.length === 1 ? "place has" : "places have"} no map coordinates yet</span>`,
      );
    }
    mapEls.foot.innerHTML =
      pills.join("") +
      '<span class="map-hint">Double-click or ctrl + scroll to zoom &middot; drag to pan</span>';
  }

  function renderLocationMap(entries) {
    lastLocationEntries = entries;
    if (!mapEls.svg) return;
    renderMapMarkers();
    renderMapFoot();
  }

  function jumpToLocationCard(key) {
    const card = els.locationGrid.querySelector(
      `.location-card[data-loc-key="${key.replace(/[\\"]/g, "\\$&")}"]`,
    );
    if (!card) return;
    try {
      const top = card.getBoundingClientRect().top + window.scrollY - railOffset() - 6;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    } catch {
      /* jsdom and older browsers */
    }
    card.classList.remove("is-flash");
    void card.offsetWidth; // restart the animation when re-clicked
    card.classList.add("is-flash");
    card.addEventListener("animationend", () => card.classList.remove("is-flash"), {
      once: true,
    });
  }

  function showCityTooltip(key, event) {
    const entry = lastLocationEntries.find(([entryKey]) => entryKey === key);
    if (!entry) return;
    const meta = cityMeta(key);
    const list = entry[1];
    const sample = list
      .slice(0, 3)
      .map((company) => company.name)
      .join(", ");
    const more = list.length > 3 ? ` +${list.length - 3} more` : "";
    const subtitle = [meta.subtitle, `${pct(list.length, lastRows.length)} of matching companies`]
      .filter(Boolean)
      .join(" · ");
    els.tooltip.innerHTML = `
      <div class="tooltip-inner">
        <div class="tooltip-head">
          <span class="tooltip-name">${escapeHtml(meta.title)}</span>
          <span class="tooltip-citycount">${list.length} ${list.length === 1 ? "company" : "companies"}</span>
        </div>
        <p class="tooltip-oneliner">${escapeHtml(subtitle)}</p>
        <p class="tooltip-signals"><strong>Companies</strong> · ${escapeHtml(sample + more)}</p>
        <p class="tooltip-maphint">Click the bubble for the full city card</p>
      </div>`;
    els.tooltip.classList.add("is-visible");
    positionTooltip(event);
  }

  function bindMapEvents() {
    els.locationMapWrap.addEventListener("click", (event) => {
      const control = event.target.closest(".map-ctrl");
      if (control) {
        if (control.id === "mapZoomIn") setMapZoom(mapState.zoom * 1.7);
        else if (control.id === "mapZoomOut") setMapZoom(mapState.zoom / 1.7);
        else setMapZoom(1);
        return;
      }
      if (mapState.dragMoved) {
        mapState.dragMoved = false;
        return;
      }
      const target = event.target.closest("[data-loc-key]");
      if (target) jumpToLocationCard(target.getAttribute("data-loc-key"));
    });

    mapEls.svg.addEventListener("mouseover", (event) => {
      const bubble = event.target.closest(".map-bubble");
      if (bubble) showCityTooltip(bubble.getAttribute("data-loc-key"), event);
    });
    mapEls.svg.addEventListener("mousemove", positionTooltip);
    mapEls.svg.addEventListener("mouseout", (event) => {
      if (!event.target.closest(".map-bubble")) return;
      const next = event.relatedTarget;
      if (!next || !next.closest || !next.closest(".map-bubble")) hideTooltip();
    });

    let dragStart = null;
    mapEls.svg.addEventListener("pointerdown", (event) => {
      if (mapState.zoom <= 1.001) return;
      const rect = mapEls.svg.getBoundingClientRect();
      if (!rect.width) return;
      dragStart = {
        x: event.clientX,
        y: event.clientY,
        cx: mapState.cx,
        cy: mapState.cy,
        scale: geoData.width / mapState.zoom / rect.width,
      };
      mapState.dragMoved = false;
      mapEls.svg.classList.add("is-dragging");
      if (mapEls.svg.setPointerCapture && event.pointerId !== undefined) {
        try {
          mapEls.svg.setPointerCapture(event.pointerId);
        } catch {
          /* pointer already released */
        }
      }
      event.preventDefault();
    });
    mapEls.svg.addEventListener("pointermove", (event) => {
      if (!dragStart) return;
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      if (Math.hypot(dx, dy) > 4) mapState.dragMoved = true;
      mapState.cx = dragStart.cx - dx * dragStart.scale;
      mapState.cy = dragStart.cy - dy * dragStart.scale;
      applyMapView();
    });
    ["pointerup", "pointercancel"].forEach((type) =>
      mapEls.svg.addEventListener(type, () => {
        dragStart = null;
        mapEls.svg.classList.remove("is-dragging");
      }),
    );

    // Trackpad pinches arrive as ctrl+wheel, so this covers pinch and
    // ctrl/cmd+scroll without hijacking normal page scrolling.
    mapEls.svg.addEventListener(
      "wheel",
      (event) => {
        if (!event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        const [focusX, focusY] = clientToMap(event);
        setMapZoom(mapState.zoom * Math.exp(-event.deltaY * 0.0016), focusX, focusY);
      },
      { passive: false },
    );

    mapEls.svg.addEventListener("dblclick", (event) => {
      // Bubbles own single-click (jump to card); only open water/land zooms.
      if (event.target.closest(".map-bubble")) return;
      const [focusX, focusY] = clientToMap(event);
      setMapZoom(event.shiftKey ? mapState.zoom / 1.8 : mapState.zoom * 1.8, focusX, focusY);
    });
  }

  /* Location view */

  const expandedLocations = new Set();
  const LOCATION_PREVIEW = 12;

  function renderLocation(rows) {
    const groups = new Map();
    rows.forEach((company) => {
      locationEntries(company).forEach((key) => {
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(company);
      });
    });
    const entries = Array.from(groups.entries()).sort(
      (a, b) =>
        b[1].length - a[1].length || cityMeta(a[0]).title.localeCompare(cityMeta(b[0]).title),
    );
    renderLocationMap(entries);

    const placeCount = entries.filter(([key]) => !key.startsWith("__")).length;
    const countries = new Set();
    entries.forEach(([key]) => {
      const country = cityMeta(key).country;
      if (country) countries.add(country);
    });
    els.locationNote.textContent = entries.length
      ? `${placeCount} locations · ${countries.size} countries — companies with offices in several places appear under each one.`
      : "";

    if (!entries.length) {
      els.locationGrid.innerHTML = `<div class="cloud-empty">No companies match these filters.</div>`;
      return;
    }

    const maxCity = entries[0][1].length;
    els.locationGrid.innerHTML = entries
      .map(([key, list]) => {
        const meta = cityMeta(key);
        const expanded = expandedLocations.has(key);
        const shown = expanded ? list : list.slice(0, LOCATION_PREVIEW);
        const widthPct = Math.max(2, Math.round((list.length / maxCity) * 100));
        const toggle =
          list.length > LOCATION_PREVIEW
            ? `<button type="button" class="location-more" data-expand="${escapeHtml(key)}">${
                expanded ? "Show fewer" : `Show all ${list.length}`
              }</button>`
            : "";
        return `
          <article class="location-card" data-loc-key="${escapeHtml(key)}">
            <div class="location-head">
              <h2>${escapeHtml(meta.title)}</h2>
              <span class="location-count">${list.length}</span>
            </div>
            ${meta.subtitle ? `<p class="location-subtitle">${escapeHtml(meta.subtitle)}</p>` : ""}
            <span class="location-bar"><span class="location-bar-fill" style="width:${widthPct}%"></span></span>
            <div class="location-companies" data-hoverable>${shown.map(miniCardHtml).join("")}</div>
            ${toggle}
          </article>`;
      })
      .join("");
  }

  /* Words view */

  const STOPWORDS = new Set(
    (
      "the and for are but not nor you your yours our ours their theirs its his her hers him " +
      "she they them than then there these those this that with without within while when " +
      "where which what who whom whose why how has have had having was were will would can " +
      "could should shall may might must being been because both each few more most other " +
      "others some such only own same very too also just into onto over under about above " +
      "below between through during before after again against all any once here from " +
      "across does did " +
      "doing done don't doesn't isn't aren't wasn't weren't won't can't couldn't wouldn't " +
      "shouldn't it's we're they're you're that's what's there's here's let's i'm we've " +
      "you've they've we'll you'll they'll via per etc and/or one two three " +
      "company companies company's business businesses customer customers customer's user " +
      "users people team teams startup startups founder founders founded product products " +
      "service services solution solutions help helps helping helped build builds building " +
      "built create creates creating created make makes making made use uses using used " +
      "need needs needed want wants work works working provide provides providing offer " +
      "offers offering enable enables enabling allow allows allowing get gets getting like " +
      "new now today time times way ways world first best better easy easily simple fast " +
      "faster every many much including include includes based focused currently well " +
      "million billion combinator backed leading mission modern experience next"
    ).split(/\s+/),
  );

  function renderWords(rows) {
    const counts = new Map();
    rows.forEach((company) => {
      const text = `${company.oneLiner || ""} ${company.longDescription || ""}`.toLowerCase();
      const seen = new Set();
      (text.match(/[a-z0-9'-]+/g) || []).forEach((raw) => {
        const word = raw.replace(/^['-]+|['-]+$/g, "");
        if (word.length < 3) return;
        if (/^\d+$/.test(word)) return;
        if (STOPWORDS.has(word)) return;
        seen.add(word);
      });
      // Doc frequency: each company votes once per word, so one verbose
      // description can't dominate the cloud.
      seen.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
    });

    const top = Array.from(counts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 60);

    if (!top.length) {
      els.wordsNote.textContent = "";
      els.wordCloud.innerHTML = `<div class="cloud-empty">No recurring words for these filters.</div>`;
      return;
    }

    els.wordsNote.textContent =
      `Top ${top.length} terms across ${rows.length} YC company descriptions, ` +
      "sized by how many companies use each one — click a word to search the map.";

    const max = top[0][1];
    els.wordCloud.innerHTML = top
      .map(([word, count], index) => {
        const size = (13 + Math.sqrt(count / max) * 23).toFixed(1);
        const isTop = index < 8;
        const opacity = isTop ? 1 : (0.45 + (count / max) * 0.55).toFixed(2);
        return `<button type="button" class="word-chip${isTop ? " is-top" : ""}" data-word="${escapeHtml(word)}" style="font-size:${size}px;--word-opacity:${opacity}">${escapeHtml(word)}<sup class="word-freq">${count}</sup></button>`;
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
            <td class="row-location">${escapeHtml(company.locationsText || "—")}</td>
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

  let lastRows = [];

  function renderViews() {
    const rows = filteredCompanies();
    lastRows = rows;
    renderSummary(rows);
    renderResultRow(rows);
    renderTimeline(rows);
    renderCategory(rows);
    renderLocation(rows);
    renderWords(rows);
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

  [els.timeline, els.categoryGrid, els.locationGrid, els.tableBody].forEach((container) => {
    container.addEventListener("click", (event) => {
      const company = companyFromEvent(event);
      if (company) openDrawer(company.id);
    });
  });

  els.locationGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-expand]");
    if (!button) return;
    const key = button.dataset.expand;
    if (expandedLocations.has(key)) {
      expandedLocations.delete(key);
    } else {
      expandedLocations.add(key);
    }
    renderLocation(lastRows);
  });

  els.wordCloud.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-word]");
    if (!chip) return;
    state.search = chip.dataset.word;
    els.searchInput.value = chip.dataset.word;
    renderViews();
  });

  [els.timeline, els.categoryGrid, els.locationGrid].forEach((container) => {
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
  buildLocationMap();
  renderViews();
  setView("timeline");
})();
