# shawnpang.xyz

Personal site of [Shawn Pang](https://x.com/0xshawnpang) — research notes and small fun projects.

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
  layout.tsx               ← root layout (fonts, generic metadata)
  page.tsx                 ← homepage (name + tagline + index of writing/projects)
  globals.css              ← shared design tokens + per-section styles
  components/
    Nav.tsx                ← used by the X-algorithm article (scrollspy + share)
    sections/              ← X-algorithm article sections
  lib/                     ← icons, hooks, data shared across the site
  x-algorithm/
    layout.tsx             ← article-specific metadata + Nav
    page.tsx               ← article entry — composes the section components
```

## Adding a new piece

- **Writing / research article**: create `app/<slug>/page.tsx` and (optionally) `app/<slug>/layout.tsx` for article-specific metadata. Link it from the homepage list in `app/page.tsx`.
- **Fun project**: same pattern — give it its own route under `app/`.

Design tokens live at the top of `app/globals.css` (colors, fonts, radii, nav height). Reuse the existing utility classes (`.t-h1`, `.t-h2`, `.t-sub`, `.t-mono`, `.wrap`, `.wrap-narrow`, `.card`, `.btn`, `.chip`) so new pages feel consistent.

## License

Personal site. Article content is mine; reuse with attribution.
