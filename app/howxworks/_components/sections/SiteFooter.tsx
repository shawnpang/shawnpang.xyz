"use client";

import { XGlyph } from "@/app/howxworks/_lib/icons";

const SHARE_TEXT = encodeURIComponent(
  "how X's algorithm actually works — finally explained visually. by @0xshawnpang"
);
const SHARE_URL = encodeURIComponent("https://shawnpang.xyz/howxworks");
const SHARE_HREF = `https://twitter.com/intent/tweet?text=${SHARE_TEXT}&url=${SHARE_URL}`;

export default function SiteFooter() {
  return (
    <footer className="foot">
      <div className="wrap-narrow">
        <h2
          className="t-h2"
          style={{ fontSize: "clamp(28px, 4vw, 44px)", marginBottom: 12 }}
        >
          Now you know how the box works.
        </h2>
        <p className="t-sub" style={{ color: "var(--text-3)", marginBottom: 28 }}>
          Share it. Save someone else 5 hours of reading the source code.
        </p>

        <div className="foot-cta">
          <a className="btn accent" href={SHARE_HREF} target="_blank" rel="noopener">
            <XGlyph size={14} /> Share on X
          </a>
          <a
            className="btn ghost"
            href="https://github.com/xai-org/x-algorithm"
            target="_blank"
            rel="noopener"
          >
            Read the source code →
          </a>
        </div>

        <div className="rule" />

        <div className="foot-meta">
          <p className="by">
            Built by{" "}
            <a href="https://twitter.com/0xshawnpang" target="_blank" rel="noopener">
              @0xshawnpang
            </a>
          </p>
          <p>
            Based on xAI&apos;s open-source release at{" "}
            <a href="https://github.com/xai-org/x-algorithm" target="_blank" rel="noopener">
              github.com/xai-org/x-algorithm
            </a>
            . Production X may differ — especially trust/safety scores, advertiser
            preferences, and continuous retraining. This explains the released snapshot.
          </p>
          <p style={{ marginTop: 24, fontSize: 13, color: "var(--text-3)" }}>
            made with love in Vancouver, Canada 🍁
          </p>
        </div>
      </div>
    </footer>
  );
}
