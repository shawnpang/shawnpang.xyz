"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2,
  Download,
  ExternalLink,
  Filter,
  Home,
  MapPin,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";
import {
  ALL_HUBS,
  ALL_TYPES,
  ANY_RELEVANCE,
  buildPeopleByFirm,
  filterInvestors,
  formatDatasetDate,
  projectPoint,
  relevanceOptions,
  sourceHost,
  sourceLinks,
  toInvestorCsv,
  typeOptions,
} from "../_lib/filters";
import type { City, Investor, Person, Summary } from "../_lib/types";

type Props = {
  investors: Investor[];
  people: Person[];
  summary: Summary;
};

type ChartData = [string, number][];

function downloadCsv(rows: Investor[]) {
  const blob = new Blob([toInvestorCsv(rows)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "filtered-fintech-investors.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function BarChart({ title, data }: { title: string; data: ChartData }) {
  const max = Math.max(...data.map(([, value]) => value), 1);

  return (
    <section className="vcmap-chart-block" aria-label={title}>
      <h2>{title}</h2>
      <div className="vcmap-bar-stack">
        {data.map(([label, value]) => (
          <div className="vcmap-bar-row" key={label}>
            <span>{label}</span>
            <div className="vcmap-bar-track">
              <div
                className="vcmap-bar-fill"
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function filterCountByHub(investors: Investor[]) {
  const counts = new Map<string, number>();

  for (const investor of investors) {
    counts.set(investor.primary_hub, (counts.get(investor.primary_hub) ?? 0) + 1);
  }

  return counts;
}

export default function FintechVcMap({ investors, people, summary }: Props) {
  const [query, setQuery] = useState("");
  const [hub, setHub] = useState(ALL_HUBS);
  const [type, setType] = useState(ALL_TYPES);
  const [stablecoin, setStablecoin] = useState(ANY_RELEVANCE);
  const [crypto, setCrypto] = useState(ANY_RELEVANCE);
  const [activeX, setActiveX] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState(
    investors[0]?.firm_slug ?? "",
  );

  const peopleByFirm = useMemo(() => buildPeopleByFirm(people), [people]);
  const hubOptions = useMemo(
    () => [ALL_HUBS, ...summary.cities.map((city) => city.hub)],
    [summary.cities],
  );

  const filtered = useMemo(
    () =>
      filterInvestors(investors, peopleByFirm, {
        query,
        hub,
        type,
        stablecoin,
        crypto,
        activeX,
      }),
    [activeX, crypto, hub, investors, peopleByFirm, query, stablecoin, type],
  );

  const selected =
    filtered.find((investor) => investor.firm_slug === selectedSlug) ??
    filtered[0] ??
    investors[0];
  const selectedPeople = selected
    ? peopleByFirm.get(selected.firm_name) ?? []
    : [];
  const filteredHubCounts = useMemo(() => filterCountByHub(filtered), [filtered]);
  const cityData: (City & { filtered_count: number })[] = summary.cities.map(
    (city) => ({
      ...city,
      filtered_count: filteredHubCounts.get(city.hub) ?? 0,
    }),
  );
  const topHubs = Object.entries(summary.hub_counts).slice(0, 8);
  const stableData = Object.entries(summary.stablecoin_counts);
  const typeData = Object.entries(summary.type_counts);
  const generatedAt = formatDatasetDate(summary.generated_at);

  function clearFilters() {
    setQuery("");
    setHub(ALL_HUBS);
    setType(ALL_TYPES);
    setStablecoin(ANY_RELEVANCE);
    setCrypto(ANY_RELEVANCE);
    setActiveX(false);
  }

  return (
    <main className="vcmap" id="top">
      <section className="vcmap-toolbar">
        <div className="vcmap-title">
          <div className="vcmap-topline">
            <Link href="/">
              <Home size={14} aria-hidden="true" />
              shawnpang.xyz
            </Link>
            <span>Data map</span>
          </div>
          <div className="vcmap-eyebrow">
            <MapPin size={16} aria-hidden="true" />
            US + Canada fintech capital map
          </div>
          <h1>North America Fintech Investor Map</h1>
          <p>
            {summary.investor_count} sourced investors across {summary.city_count} hubs,
            tagged by stage, subsector, stablecoin relevance, crypto relevance,
            and founder-useful pitch path.
          </p>
          <div className="vcmap-source-row" aria-label="Source links">
            <a href="#methodology">Methodology</a>
            <a href="#fact-check">Fact-check log</a>
            <span>Last updated {generatedAt}</span>
          </div>
        </div>
        <div className="vcmap-stat-strip" aria-label="Dataset summary">
          <div>
            <strong>{summary.investor_count}</strong>
            <span>investors</span>
          </div>
          <div>
            <strong>{summary.city_count}</strong>
            <span>hubs</span>
          </div>
          <div>
            <strong>{summary.stablecoin_counts.direct}</strong>
            <span>direct stablecoin</span>
          </div>
          <div>
            <strong>{summary.people_count}</strong>
            <span>people records</span>
          </div>
        </div>
      </section>

      <section className="vcmap-filter-band" aria-label="Investor filters">
        <label className="vcmap-search-box">
          <span>Search</span>
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search firms, subsectors, portfolio examples"
          />
        </label>
        <label>
          <span>Hub</span>
          <select value={hub} onChange={(event) => setHub(event.target.value)}>
            {hubOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Type</span>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            {typeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Stablecoin</span>
          <select
            value={stablecoin}
            onChange={(event) => setStablecoin(event.target.value)}
          >
            {relevanceOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Crypto</span>
          <select
            value={crypto}
            onChange={(event) => setCrypto(event.target.value)}
          >
            {relevanceOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <button
          className={`vcmap-toggle${activeX ? " is-on" : ""}`}
          onClick={() => setActiveX((value) => !value)}
          type="button"
          aria-pressed={activeX}
          title="Show firms with active X people records"
        >
          <Users size={17} aria-hidden="true" />
          Active X
        </button>
        <button
          className="vcmap-icon-button"
          onClick={() => downloadCsv(filtered)}
          type="button"
          aria-label="Download filtered CSV"
          title="Download filtered CSV"
        >
          <Download size={18} aria-hidden="true" />
        </button>
        <button
          className="vcmap-icon-button"
          onClick={clearFilters}
          type="button"
          aria-label="Clear filters"
          title="Clear filters"
        >
          <RotateCcw size={18} aria-hidden="true" />
        </button>
      </section>

      <section className="vcmap-map-directory-grid">
        <div className="vcmap-map-panel">
          <div className="vcmap-panel-heading">
            <div>
              <h2>Capital Density</h2>
              <p>
                Bubble size is selected investor count. Filled segment shows the
                current filter; gold marks direct stablecoin signal.
              </p>
            </div>
            <span>{filtered.length} matching</span>
          </div>
          <svg
            className="vcmap-hub-map"
            viewBox="0 0 100 58"
            role="img"
            aria-label="US and Canada fintech investor hub map"
          >
            <rect x="2" y="2" width="96" height="54" rx="2" className="vcmap-map-base" />
            <path
              d="M9 19 C18 12 28 10 38 14 C49 18 63 12 77 18 C89 24 93 36 86 44 C78 54 59 50 45 51 C27 52 13 47 8 35 C6 29 6 24 9 19Z"
              className="vcmap-map-land"
            />
            {cityData.map((city) => {
              const { x, y } = projectPoint(city.lng, city.lat);
              const radius = Math.max(4, Math.sqrt(city.investor_count) * 1.65);
              const filteredRadius = Math.max(
                2,
                Math.sqrt(city.filtered_count) * 1.65,
              );

              return (
                <g
                  key={city.hub}
                  className="vcmap-hub-node"
                  onClick={() => setHub(city.hub)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setHub(city.hub);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Filter to ${city.hub}`}
                >
                  <circle cx={x} cy={y} r={radius} className="vcmap-hub-total" />
                  <circle
                    cx={x}
                    cy={y}
                    r={filteredRadius}
                    className="vcmap-hub-filtered"
                  />
                  {city.stablecoin_direct_count > 0 && (
                    <circle
                      cx={x + radius * 0.38}
                      cy={y - radius * 0.38}
                      r={Math.max(1.6, city.stablecoin_direct_count * 0.45)}
                      className="vcmap-hub-stable"
                    />
                  )}
                  <text x={x + radius + 1.2} y={y + 0.8}>
                    {city.hub}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="vcmap-legend">
            <span>
              <i className="vcmap-legend-total" /> Total selected investors
            </span>
            <span>
              <i className="vcmap-legend-filtered" /> Current filter
            </span>
            <span>
              <i className="vcmap-legend-stable" /> Direct stablecoin signal
            </span>
          </div>
        </div>

        <aside className="vcmap-profile-panel" aria-label="Selected investor profile">
          {selected && (
            <>
              <div className="vcmap-profile-header">
                <div>
                  <p>
                    {selected.investor_type} - {selected.primary_hub}
                  </p>
                  <h2>{selected.firm_name}</h2>
                </div>
                <a
                  href={selected.website}
                  target="_blank"
                  rel="noreferrer"
                  title="Open firm website"
                  aria-label={`Open ${selected.firm_name} website`}
                >
                  <ExternalLink size={18} aria-hidden="true" />
                </a>
              </div>
              <dl className="vcmap-profile-facts">
                <div>
                  <dt>HQ</dt>
                  <dd>
                    {selected.hq_city}, {selected.hq_country}
                  </dd>
                </div>
                <div>
                  <dt>Stage</dt>
                  <dd>{selected.stage_focus}</dd>
                </div>
                <div>
                  <dt>Stablecoin</dt>
                  <dd>{selected.stablecoin_relevance}</dd>
                </div>
                <div>
                  <dt>Crypto</dt>
                  <dd>{selected.crypto_relevance}</dd>
                </div>
              </dl>
              <div className="vcmap-profile-section">
                <h3>Focus</h3>
                <p>{selected.fintech_subsectors}</p>
              </div>
              <div className="vcmap-profile-section">
                <h3>Portfolio Signals</h3>
                <p>{selected.notable_fintech_portfolio}</p>
              </div>
              <div className="vcmap-profile-section">
                <h3>Pitch Path</h3>
                <p>{selected.pitch_path}</p>
              </div>
              {selectedPeople.length > 0 && (
                <div className="vcmap-profile-section">
                  <h3>People</h3>
                  <div className="vcmap-people-list">
                    {selectedPeople.map((person) => {
                      const personSources = sourceLinks(person.source_urls);
                      return (
                        <a
                          key={`${person.person_name}-${person.firm_name}`}
                          href={person.x_url || personSources[0] || selected.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {person.person_name}
                          {person.x_handle ? <span>{person.x_handle}</span> : null}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="vcmap-profile-section">
                <h3>Sources</h3>
                <div className="vcmap-source-list">
                  {sourceLinks(selected.source_urls)
                    .slice(0, 3)
                    .map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer">
                        {sourceHost(url)}
                      </a>
                    ))}
                </div>
              </div>
            </>
          )}
        </aside>
      </section>

      <section className="vcmap-method-grid" aria-label="Methodology and fact-check">
        <article className="vcmap-method-card" id="methodology">
          <p className="vcmap-method-kicker">Methodology</p>
          <h2>Curated v1 map, not an exhaustive database.</h2>
          <p>
            The dataset prioritizes VC firms, corporate venture arms, and
            accelerator programs with public fintech relevance across the US and
            Canada. Investor records include source URLs, hub-level coordinates,
            stage focus, subsector tags, pitch path, confidence, and verification
            date.
          </p>
          <ul>
            <li>Primary sources are official firm, team, portfolio, and program pages.</li>
            <li>Stablecoin relevance is tagged as direct, indirect, or none.</li>
            <li>X handles are intentionally sparse and only included when reasonably verifiable.</li>
          </ul>
        </article>
        <article className="vcmap-method-card" id="fact-check">
          <p className="vcmap-method-kicker">Fact-check log</p>
          <h2>Validation passed for scope, duplicates, URLs, and coordinates.</h2>
          <p>
            The source validation checked {summary.investor_count} selected
            investors, {summary.city_count} planned hubs, allowed investor
            types, US/Canada geography, required fields, URL formatting,
            X handle format, and rough map bounds.
          </p>
          <a href="#top">Back to map</a>
        </article>
      </section>

      <section className="vcmap-charts-grid">
        <BarChart title="Top Hubs" data={topHubs} />
        <BarChart title="Investor Types" data={typeData} />
        <BarChart title="Stablecoin Relevance" data={stableData} />
      </section>

      <section className="vcmap-directory-band">
        <div className="vcmap-panel-heading">
          <div>
            <h2>Investor Directory</h2>
            <p>Select a firm to inspect sources, pitch path, and portfolio examples.</p>
          </div>
          <div className="vcmap-result-count">
            <Filter size={16} aria-hidden="true" />
            {filtered.length} results
          </div>
        </div>
        <div className="vcmap-investor-list">
          {filtered.map((investor) => (
            <button
              key={investor.firm_slug}
              className={`vcmap-investor-row${
                selected?.firm_slug === investor.firm_slug ? " is-selected" : ""
              }`}
              onClick={() => setSelectedSlug(investor.firm_slug)}
              type="button"
            >
              <span className="vcmap-firm-icon">
                <Building2 size={17} aria-hidden="true" />
              </span>
              <span className="vcmap-firm-main">
                <strong>{investor.firm_name}</strong>
                <small>
                  {investor.primary_hub} - {investor.stage_focus}
                </small>
              </span>
              <span className={`vcmap-pill ${investor.investor_type.toLowerCase()}`}>
                {investor.investor_type}
              </span>
              <span className={`vcmap-pill relevance-${investor.stablecoin_relevance}`}>
                stablecoin {investor.stablecoin_relevance}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
