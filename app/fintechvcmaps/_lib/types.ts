export type InvestorType = "VC" | "CVC" | "Accelerator";
export type Relevance = "direct" | "indirect" | "none";

export type Investor = {
  firm_slug: string;
  firm_name: string;
  investor_type: InvestorType;
  founded_year: string;
  primary_hub: string;
  hq_city: string;
  hq_country: string;
  latitude: string;
  longitude: string;
  office_cities: string;
  website: string;
  stage_focus: string;
  check_size: string;
  fintech_subsectors: string;
  stablecoin_relevance: Relevance;
  crypto_relevance: Relevance;
  notable_fintech_portfolio: string;
  recent_deals_2021_2026: string;
  fund_size_or_aum: string;
  pitch_path: string;
  source_urls: string;
  major_score: string;
  confidence: string;
  last_verified: string;
  notes: string;
};

export type Person = {
  person_name: string;
  firm_name: string;
  title: string;
  city: string;
  focus_areas: string;
  x_handle: string;
  x_url: string;
  active_on_x: string;
  source_urls: string;
  last_verified: string;
};

export type City = {
  hub: string;
  lat: number;
  lng: number;
  investor_count: number;
  major_score_sum: number;
  stablecoin_direct_count: number;
  crypto_direct_count: number;
  cvc_or_accelerator_count: number;
};

export type Summary = {
  generated_at: string;
  investor_count: number;
  people_count: number;
  city_count: number;
  hub_counts: Record<string, number>;
  type_counts: Record<string, number>;
  stablecoin_counts: Record<string, number>;
  crypto_counts: Record<string, number>;
  stage_counts: Record<string, number>;
  subsector_counts: Record<string, number>;
  cities: City[];
};

export type InvestorFilters = {
  query: string;
  hub: string;
  type: string;
  stablecoin: string;
  crypto: string;
  activeX: boolean;
};
