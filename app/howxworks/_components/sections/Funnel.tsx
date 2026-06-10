"use client";

import { useEffect, useState } from "react";
import { nFull, nfmt } from "@/app/howxworks/_lib/data";

const STAGES = [
  { key: "pool",   label: "Candidates gathered", value: 10000, color: "var(--text-3)", note: "in-network + out-of-network" },
  { key: "filter", label: "After filters",       value: 4200,  color: "var(--text-2)", note: "blocks · mutes · seen · old · spam" },
  { key: "ranked", label: "Scored by AI",        value: 1500,  color: "var(--accent)", note: "19 predictions per post" },
  { key: "top",    label: "Top picks shown",     value: 50,    color: "var(--good)",   note: "what fills your screen" },
];

const DOT_KEEP = [1.0, 0.42, 0.15, 0.005];

type Dot = { x: number; y: number; keep: number };

function seededUnit(index: number, salt: number) {
  const raw = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

const DOTS: Dot[] = Array.from({ length: 400 }, (_, index) => ({
  x: seededUnit(index, 1),
  y: seededUnit(index, 2),
  keep: seededUnit(index, 3),
}));

export default function Funnel() {
  const [stage, setStage] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 2200);
    return () => clearInterval(id);
  }, [auto]);

  const cur = STAGES[stage];
  const widthPct = 100 - stage * 22;

  return (
    <section className="chapter" id="ch-funnel" style={{ background: "var(--bg-2)" }}>
      <div className="wrap">
        <div className="chapter-head">
          <span className="t-eyebrow">03 · The funnel</span>
          <h2 className="t-h2">
            10,000 candidates.<br />
            <span style={{ color: "var(--good)" }}>50</span> survive.
          </h2>
          <p className="t-sub" style={{ maxWidth: 700 }}>
            From the moment you tap the app, the algorithm shrinks a giant pool stage by stage. Drag the slider to step through.
          </p>
        </div>

        <div className="fun-grid">
          <div className="fun-stage-card">
            <div className="t-mono" style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: ".14em" }}>
              STAGE {stage + 1} OF {STAGES.length}
            </div>
            <div className="fun-big-num t-num" style={{ color: cur.color }}>{nFull(cur.value)}</div>
            <div className="fun-big-label">{cur.label}</div>
            <div className="fun-note">{cur.note}</div>

            <div className="fun-pcts">
              {STAGES.map((s, i) => (
                <button
                  key={s.key}
                  className={`fun-step ${i === stage ? "is-active" : ""} ${i < stage ? "is-past" : ""}`}
                  onClick={() => { setStage(i); setAuto(false); }}
                >
                  <span className="t-mono num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="lbl">{s.label}</span>
                  <span className="val t-num">{nfmt(s.value)}</span>
                </button>
              ))}
            </div>

            <div className="fun-slider-row">
              <input
                type="range"
                min="0"
                max={STAGES.length - 1}
                step="1"
                value={stage}
                onChange={(e) => { setStage(parseInt(e.target.value)); setAuto(false); }}
                className="fun-slider"
                aria-label="Funnel stage"
              />
              <button className="btn ghost" onClick={() => setAuto((a) => !a)} style={{ height: 36, padding: "0 14px" }}>
                {auto ? "Pause" : "Auto"}
              </button>
            </div>
          </div>

          <div className="fun-viz">
            <div className="fun-dots" aria-hidden="true">
              {DOTS.map((d, i) => {
                const keep = d.keep < DOT_KEEP[stage];
                return (
                  <span
                    key={i}
                    className="dot"
                    style={{
                      left: `${d.x * 100}%`,
                      top: `${d.y * 100}%`,
                      opacity: keep ? 1 : 0.08,
                      background: keep
                        ? stage === 3 && d.keep < 0.005
                          ? "var(--good)"
                          : stage === 2
                          ? "var(--accent)"
                          : stage === 1
                          ? "var(--text-2)"
                          : "var(--text-3)"
                        : "var(--text-4)",
                      transform: `scale(${keep ? 1 : 0.6})`,
                      transitionDelay: `${(d.keep * 600) | 0}ms`,
                    }}
                  />
                );
              })}
            </div>
            <div className="fun-frame" style={{ width: `${widthPct}%` }}>
              <div className="fun-frame-label t-mono">{cur.label.toUpperCase()}</div>
            </div>
          </div>
        </div>

        <div className="fun-foot t-mono">
          ROUGH ORDER-OF-MAGNITUDE NUMBERS · ACTUAL COUNTS VARY PER USER
        </div>
      </div>
    </section>
  );
}
