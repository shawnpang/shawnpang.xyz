import Link from "next/link";
import { siteItems, type SiteItem, type SiteItemKind } from "./_content/siteItems";

const sections: { title: string; kinds: SiteItemKind[] }[] = [
  { title: "Research", kinds: ["research"] },
  { title: "Writing", kinds: ["writing"] },
  { title: "Projects", kinds: ["project", "data-map"] },
  { title: "Notes", kinds: ["note"] },
];

const kindLabels: Record<SiteItemKind, string> = {
  research: "Research",
  "data-map": "Data map",
  writing: "Writing",
  project: "Project",
  note: "Note",
};

function metaForItem(item: SiteItem) {
  return item.status === "Live" ? item.date : item.status;
}

function ItemList({ items }: { items: SiteItem[] }) {
  if (items.length === 0) {
    return <p className="home-empty">More soon.</p>;
  }

  return (
    <ul className="home-list">
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href}>
            <span className="home-list-main">
              <span className="home-list-title">{item.title}</span>
              <span className="home-list-desc">{item.description}</span>
            </span>
            <span className="home-list-meta">{metaForItem(item)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FeaturedItems({ items }: { items: SiteItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="home-section">
      <h2 className="home-section-title">Featured</h2>
      <div className="home-feature-grid">
        {items.map((item) => (
          <Link className="home-feature-card" href={item.href} key={item.href}>
            <span className="home-feature-kicker">
              {kindLabels[item.kind]} - {item.status} - {item.date}
            </span>
            <span className="home-feature-title">{item.title}</span>
            <span className="home-feature-desc">{item.description}</span>
            <span className="home-tags" aria-label="Tags">
              {item.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const featuredItems = siteItems.filter((item) => item.featured);

  return (
    <main className="home">
      <div className="home-inner">
        <header className="home-head">
          <h1 className="home-name">Shawn Pang</h1>
          <p className="home-tag">
            Founder of AllScale. Notes on what I&apos;m building, reading,
            and thinking about.
          </p>
          <div className="home-links">
            <a
              className="home-link"
              href="https://x.com/0xshawnpang"
              target="_blank"
              rel="noopener"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>@0xshawnpang</span>
            </a>
          </div>
        </header>

        <FeaturedItems items={featuredItems} />

        {sections.map((section) => (
          <section className="home-section" key={section.title}>
            <h2 className="home-section-title">{section.title}</h2>
            <ItemList
              items={siteItems.filter((item) =>
                section.kinds.includes(item.kind),
              )}
            />
          </section>
        ))}
      </div>

      <footer className="home-foot">shawnpang.xyz</footer>
    </main>
  );
}
