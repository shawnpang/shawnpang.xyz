import type { Investor, InvestorFilters, Person } from "./types";

export const ALL_HUBS = "All hubs";
export const ALL_TYPES = "All types";
export const ANY_RELEVANCE = "Any";

export const typeOptions = [ALL_TYPES, "VC", "CVC", "Accelerator"];
export const relevanceOptions = [
  ANY_RELEVANCE,
  "direct",
  "indirect",
  "none",
];

const csvFields: (keyof Investor)[] = [
  "firm_name",
  "investor_type",
  "primary_hub",
  "hq_city",
  "hq_country",
  "stage_focus",
  "fintech_subsectors",
  "stablecoin_relevance",
  "crypto_relevance",
  "pitch_path",
  "website",
];

export function buildPeopleByFirm(people: Person[]) {
  const peopleByFirm = new Map<string, Person[]>();

  for (const person of people) {
    peopleByFirm.set(person.firm_name, [
      ...(peopleByFirm.get(person.firm_name) ?? []),
      person,
    ]);
  }

  return peopleByFirm;
}

export function filterInvestors(
  investors: Investor[],
  peopleByFirm: Map<string, Person[]>,
  filters: InvestorFilters,
) {
  const q = filters.query.trim().toLowerCase();

  return investors.filter((investor) => {
    const firmPeople = peopleByFirm.get(investor.firm_name) ?? [];
    const haystack = [
      investor.firm_name,
      investor.primary_hub,
      investor.stage_focus,
      investor.fintech_subsectors,
      investor.notable_fintech_portfolio,
      investor.recent_deals_2021_2026,
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!q || haystack.includes(q)) &&
      (filters.hub === ALL_HUBS || investor.primary_hub === filters.hub) &&
      (filters.type === ALL_TYPES ||
        investor.investor_type === filters.type) &&
      (filters.stablecoin === ANY_RELEVANCE ||
        investor.stablecoin_relevance === filters.stablecoin) &&
      (filters.crypto === ANY_RELEVANCE ||
        investor.crypto_relevance === filters.crypto) &&
      (!filters.activeX ||
        firmPeople.some((person) => person.active_on_x === "yes"))
    );
  });
}

export function sourceLinks(value: string) {
  return value
    .split(";")
    .map((url) => url.trim())
    .filter(Boolean);
}

export function sourceHost(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export function projectPoint(lng: number, lat: number) {
  const minLng = -127;
  const maxLng = -66;
  const minLat = 24;
  const maxLat = 52;

  return {
    x: ((lng - minLng) / (maxLng - minLng)) * 100,
    y: ((maxLat - lat) / (maxLat - minLat)) * 58,
  };
}

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function toInvestorCsv(rows: Investor[]) {
  return [
    csvFields.join(","),
    ...rows.map((row) =>
      csvFields.map((field) => csvEscape(String(row[field] ?? ""))).join(","),
    ),
  ].join("\n");
}

export function formatDatasetDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
