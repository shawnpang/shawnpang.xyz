# YC Fintech Wave Map

Standalone static map hosted at `/yc-fintech-wave-map/index.html`.

## Design

AllScale-branded interface: Archivo for UI, DM Mono for data, Playfair Display for the
narrative headline, with green `#009859` as the only accent on warm gray-green neutrals.
The hero frames the five waves with the corner-bracket logo motif and a non-interactive
wave spine; filtering lives entirely in the sticky controls bar (Timeline / Category /
Table views, search, and multi-select wave/theme/status filters).

In the Timeline view a floating wave rail (left edge on desktop, right edge on phones)
tracks the wave currently in view; click or drag along it to jump between waves.

## Source Data

The map is generated from the clean YC fintech/payments/stablecoin company dataset and enriched with public YC directory data.

Primary YC data sources:

- YC OSS company API: `https://yc-oss.github.io/api/companies/all.json`
- YC OSS metadata API: `https://yc-oss.github.io/api/meta.json`
- YC company directory pages: `https://www.ycombinator.com/companies/{slug}`

The YC OSS metadata timestamp embedded in `data.js` is:

`2026-06-11T02:44:14.468Z`

Founder LinkedIn and X links are parsed only from public YC company directory pages. No founder social profiles are inferred or guessed.

## Current Coverage

- Companies: `666`
- Founders parsed from YC directory pages: `1,302`
- Companies with founder social links: `657`
- Founder LinkedIn links: `1,282`
- Founder X links: `548`

## Attribution

Built by Shawn Pang from AllScale.

- AllScale: `https://allscale.io`
- X: `https://x.com/0xshawnpang`
- LinkedIn: `https://www.linkedin.com/in/shawnshunxinpang/`
