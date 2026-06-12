# shawnpang.xyz

Personal site of [Shawn Pang](https://x.com/0xshawnpang) — notes on what I'm building, reading, and thinking about.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind v4
- Deployed on Vercel

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Project layout

```
app/
  layout.tsx         ← root layout (fonts, html, body)
  page.tsx           ← homepage (name + tagline + lists of writing/projects/notes)
  globals.css        ← shared design tokens, base styles, .home-* styles
  howxworks/         ← "How X's algorithm works" article (lives at /howxworks)
    layout.tsx       ← article-specific metadata + Nav
    page.tsx         ← composes the section components
    _components/     ← only used by this article (folders prefixed with _ are not routed)
      Nav.tsx
      sections/      ← Hero, Buckets, Filters, Signals, ScoreSim, ...
    _lib/            ← article-specific data, hooks, icons
      data.ts        ← CHAPTERS, AUTHORS, POST_SEEDS, IconName
      hooks.ts       ← useCountUp
      icons.tsx      ← Icon (with IconName) and XGlyph
next.config.ts       ← redirects /x and /x-algorithm to /howxworks
```

## Adding a new piece

Each content piece lives in its own folder under `app/`:

```
app/<slug>/
  layout.tsx         ← optional, for piece-specific metadata
  page.tsx           ← the page itself
  _components/       ← components only this piece uses
  _lib/              ← data/utilities only this piece uses
```

Then link it from the homepage list in `app/page.tsx`. The `_components/` and `_lib/` prefix means Next.js won't route them.

Design tokens are at the top of `app/globals.css`. Reuse existing utility classes (`.t-h1`, `.t-h2`, `.t-sub`, `.t-mono`, `.wrap`, `.wrap-narrow`, `.card`, `.btn`, `.chip`) so new pages feel consistent.

## Adding a New Article or Data Map

1. Add metadata to `app/_content/siteItems.ts`.
2. Create `app/<slug>/page.tsx`.
3. For data maps, place static data in `app/<slug>/_data/`.
4. Keep page-specific components in `app/<slug>/_components/`.
5. Put route-local types and filtering helpers in `app/<slug>/_lib/`.
6. Link the new item from the homepage via the registry.
7. Run `npm run lint` and `npm run build`.

Recommended data-map folder pattern:

```
app/<slug>/
  page.tsx
  layout.tsx
  _components/
  _data/
    dataset.json
    people.json
    summary.json
  _lib/
    types.ts
    filters.ts
```

## Redirects

- `/x` → `/howxworks` (short alias)
- `/x-algorithm` → `/howxworks` (legacy URL from the intermediate restructure)
- `/yc-fintech-map` → `/yc-fintech-wave-map/index.html` (short alias)
- `/yc-fintech-wave-map` → `/yc-fintech-wave-map/index.html` (bare folder path would 404)

## License

Personal site. Article content is mine; reuse with attribution.
