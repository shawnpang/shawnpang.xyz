export type SiteItemKind =
  | "research"
  | "data-map"
  | "writing"
  | "project"
  | "note";

export type SiteItemStatus = "Live" | "Draft" | "WIP";

export type SiteItem = {
  title: string;
  href: string;
  kind: SiteItemKind;
  status: SiteItemStatus;
  date: string;
  description: string;
  tags: string[];
  featured?: boolean;
};

export const siteItems: SiteItem[] = [
  {
    title: "YC Fintech Wave Map",
    href: "/yc-fintech-wave-map/index.html",
    kind: "data-map",
    status: "Live",
    date: "June 2026",
    description:
      "All 666 YC fintech, payments, and stablecoin companies mapped across five waves, from payment rails to AI-native finance.",
    tags: ["fintech", "YC", "stablecoins"],
    featured: true,
  },
  {
    title: "North America Fintech VC Map",
    href: "/fintechvcmaps",
    kind: "data-map",
    status: "Live",
    date: "June 2026",
    description:
      "A sourced map of 150 fintech investors across the US and Canada, with stablecoin relevance and founder pitch paths.",
    tags: ["fintech", "VC", "stablecoins"],
    featured: true,
  },
  {
    title: "How X's algorithm actually works",
    href: "/howxworks",
    kind: "research",
    status: "Live",
    date: "May 2026",
    description:
      "A visual, plain-English explainer of how X decides what to show you.",
    tags: ["algorithms", "social", "ranking"],
    featured: true,
  },
  {
    title: "LLM as a religion",
    href: "/llm-as-a-religion",
    kind: "writing",
    status: "Draft",
    date: "May 2026",
    description:
      "Notes on treating large language models as a religion: the believers, rites, and doctrine.",
    tags: ["AI", "culture", "notes"],
  },
];
