"use client";

import { useEffect, useState } from "react";
import { CHAPTERS } from "@/app/howxworks/_lib/data";

const SHARE_TEXT = encodeURIComponent(
  "how X's algorithm actually works — finally explained visually. by @0xshawnpang"
);
const SHARE_URL = encodeURIComponent("https://shawnpang.xyz/howxworks");
const SHARE_HREF = `https://twitter.com/intent/tweet?text=${SHARE_TEXT}&url=${SHARE_URL}`;

export default function Nav() {
  const [activeId, setActiveId] = useState<string>(CHAPTERS[0].id);

  // Scrollspy
  useEffect(() => {
    const els = CHAPTERS.map((c) => document.getElementById(c.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav className="nav" id="topNav">
      <div className="nav-inner">
        <a className="nav-brand" href="#top">
          <span className="xglyph">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </span>
          <span className="nav-brand-text">How X&apos;s algorithm works</span>
        </a>

        <div className="nav-links" id="navLinks">
          {CHAPTERS.map((c) => (
            <a
              key={c.id}
              className={`nav-link ${c.id === activeId ? "is-active" : ""}`}
              href={`#${c.id}`}
            >
              <span className="num">{c.num}</span>
              {c.title}
            </a>
          ))}
        </div>

        <a
          className="share-btn"
          id="shareBtn"
          href={SHARE_HREF}
          target="_blank"
          rel="noopener"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>Share</span>
        </a>
      </div>
    </nav>
  );
}
