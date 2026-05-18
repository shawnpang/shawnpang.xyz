import { XGlyph } from "@/app/lib/icons";

export default function Home() {
  return (
    <main className="home">
      <div className="home-inner">
        <header className="home-head">
          <h1 className="home-name">Shawn Pang</h1>
          <p className="home-tag">
            Building things at AllScale. Research notes and small fun projects
            live here.
          </p>
          <div className="home-links">
            <a
              className="home-link"
              href="https://x.com/0xshawnpang"
              target="_blank"
              rel="noopener"
            >
              <XGlyph size={14} />
              <span>@0xshawnpang</span>
            </a>
          </div>
        </header>

        <section className="home-section">
          <h2 className="home-section-title">Writing</h2>
          <ul className="home-list">
            <li>
              <a href="/x-algorithm">
                <span className="home-list-title">
                  How X&apos;s algorithm actually works
                </span>
                <span className="home-list-meta">May 2026</span>
              </a>
            </li>
          </ul>
        </section>

        <section className="home-section">
          <h2 className="home-section-title">Projects</h2>
          <p className="home-empty">More soon.</p>
        </section>
      </div>

      <footer className="home-foot">shawnpang.xyz</footer>
    </main>
  );
}
