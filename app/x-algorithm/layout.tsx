import type { Metadata } from "next";
import Nav from "@/app/components/Nav";

export const metadata: Metadata = {
  title: "How X's algorithm actually works — a visual guide",
  description:
    "A visual, interactive plain-English explainer of how X (Twitter) decides what to show you. Based on the open-sourced ranker.",
};

export default function XAlgorithmLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="with-nav">
      <Nav />
      <main id="top">{children}</main>
    </div>
  );
}
