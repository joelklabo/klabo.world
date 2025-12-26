# Design Modernization & Simplification Plan

Goal: refresh klabo.world so it feels warm, colorful, and playful while keeping content legible, code-focused, and fast. This is a north-star plan for Phase 5 UI work.

## Direction
- **Tone**: optimistic, tinkerer energy; fewer harsh blacks—lean into deep navy + warm amber/coral accents; generous rounding and soft shadows.
- **Typography**: switch to a distinctive sans + mono pair.
  - Primary: **Manrope** (700/600/400) for headings and nav; rounded geometry fits playful direction.
  - Body: Manrope 400/500; tighten letter spacing slightly.
  - Code: **JetBrains Mono** (or Geist Mono if we keep vendor parity) at 0.95em with toned-down background.
- **Iconography**: prefer stroked icons (Lucide) with 1.75px stroke; keep minimal.

## Color System (OKLCH targets)
- Base canvas: Deep navy `oklch(0.16, 0.04, 260)`
- Surface: `oklch(0.24, 0.03, 250)`
- Primary accent: Warm amber `oklch(0.72, 0.16, 80)` for CTAs, tags, links.
- Secondary: Coral/pink `oklch(0.68, 0.14, 35)` for hover/active and charts.
- Success: `oklch(0.72, 0.13, 150)`; Warning: `oklch(0.72, 0.14, 80)`; Danger: `oklch(0.62, 0.20, 25)`.
- Muted text: `oklch(0.72, 0.02, 260)`; Borders: `oklch(0.32, 0.02, 260)`.
- Gradients: pair accent → secondary on hero backgrounds; subtle radial glows behind cards.

## Layout & Components
- **Header**: keep sticky but reduce height; add tinted glass blur; hover states with underlines instead of bolding.
- **Search**: new floating dropdown already landed; follow-up to add subtle shadow + max-width 720px and keyboard chip hints.
- **Cards**: 18px radius, 1px translucent border, shadow only on hover; consistent padding scale (12/16/20/28).
- **Buttons**: primary = amber filled; secondary = outline with coral hover fill; pill shape with 12px radius.
- **Tags/Chips**: smaller uppercase text, background `accent/10`, border `accent/30`; ensure focus ring.
- **Tables/Lists**: zebra with low-contrast banding, compact header.
- **Admin**: reuse same tokens; avoid separate theme.

## Markdown & Code
- Adopt a Prism theme derived from the accent palette (background `oklch(0.14,0.04,260)`, strings coral, keywords amber, comments slate).
- Images: bounded (already shipped), add drop shadow + caption style; center code blocks with consistent max-width.
- Blockquotes: left rule in amber, softer background.

## Motion
- Entrance: 120–160ms fade/slide-up for cards and search results.
- Hover: micro-translate 2–3px, shadow lift; reduce everywhere else.
- Skeletons: shimmer using accent gradient.

## Status (2025-12-01)
- Completed: OKLCH tokens and warm palette in `globals.css`; Manrope + JetBrains Mono swapped in; header/nav, cards, prose, and motion/focus utilities refreshed.
- Pending: polish the header search dropdown (shadow, 720px max width, shortcut chips) and restyle the `/search` page to match the warm theme; capture final visual QA once search updates land.

## Audit update (2025-12-26)
- Public UX audit completed. Findings: `/posts*` and `/apps*` still use legacy gradients and amber/slate colors; MDX components are custom-styled with non-token colors; search dropdown and `/search` page have minor drift and accessibility gaps; `globals.css` contains malformed OKLCH values that must be corrected.
- See `docs/design/public-ux-audit.md` for route-by-route notes and QA checklist.

### Sequencing (updated)
1) Fix invalid OKLCH tokens and base theme variables in `globals.css`.
2) Restyle `/posts`, `/posts/tags`, `/posts/tag/[tag]`, and `/posts/[slug]` to use tokenized palette + shared card/chip styles.
3) Restyle `/apps` and `/apps/[slug]` to use tokenized palette + shared card/CTA styles.
4) Align MDX components (code blocks, images, blockquotes, tables) to tokenized palette.
5) Improve search UX: highlights/snippets + ARIA listbox semantics + skip link.
6) Add sitemap/robots, security headers/CSP, and Web Vitals telemetry.
7) Re-run visual QA checklist for public routes and update Phase 5 visual checks.

## Accessibility & Guardrails
- Contrast: maintain WCAG AA on body text (≥4.5:1) and AA Large on headings/CTA (≥3:1). Keep amber on navy at ≥3.2:1; coral reserved for hover.
- Focus: 2px outline using accent + 50% opacity overlay; never drop focus rings.
- Typography scale: base 16px; heading ratio 1.25; max line length 68–74ch on articles.

## Implementation Steps (qzx)
1) Add design tokens to `globals.css` (OKLCH values above) and wire Tailwind theme variables.
2) Swap fonts to Manrope + JetBrains Mono via next/font with self-hosted woff2.
3) Update layout primitives (header, buttons, cards, tags) to the new tokens.
4) Apply markdown/code theme and refine prose spacing; add gradient hero on posts/home.
5) Add motion primitives (utility classes) and audit focus states.

## UI Simplification (qzx.3)
- Reduce chrome: fewer borders, rely on soft shadows and subtle gradients; keep 1px translucent outlines for separation.
- Normalize padding/spacing scale (8/12/16/24/32) across cards, nav, and lists; avoid nested heavy containers.
- Consolidate button styles to two variants (solid amber, outline coral) and one size with pill radius.
- Use consistent chip/tag treatment (uppercase tiny text, light accent fill) across posts, apps, search.
- Keep hero/section headings compact with 1–2 lines of subtext; avoid mega banners.

## Deliverables
- Tokenized CSS variables, font setup, updated component styles, and refreshed markdown/code theme across posts/admin.
- Visual QA checklist + screenshots for home, post detail, admin dashboard, and search.
