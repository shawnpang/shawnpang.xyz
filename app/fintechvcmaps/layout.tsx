import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "North America Fintech VC Map - Shawn Pang",
  description:
    "A sourced data map of fintech investors across the US and Canada, tagged by hub, stage, stablecoin relevance, and founder pitch path.",
};

export default function FintechVcMapsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
