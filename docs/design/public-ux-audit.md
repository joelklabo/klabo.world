# Public UX Audit (2025-12-26)

Goal: bring all public routes into the tokenized “warm modern” system (see `docs/design/modernization-plan.md`), reduce drift, and provide a visual QA checklist for future verification.

## Scope
- Routes: `/`, `/projects`, `/search`, `/posts`, `/posts/tags`, `/posts/tag/[tag]`, `/posts/[slug]`, `/apps`, `/apps/[slug]`
- Shared: global navigation, search dropdown, MDX components, cards, chips, buttons

## High-level findings
- **Theme drift**: `/posts*` and `/apps*` still use hard-coded gradients + amber/slate palette. `/`, `/projects`, `/search` are tokenized, creating an inconsistent public experience.
- **Component inconsistency**: Cards, chips, and CTAs are restyled per-page instead of reusing shared token styles (e.g., different borders, radii, shadows).
- **Search UX**: Search dropdown and `/search` use tokenized layout but still contain hard-coded text colors (e.g., `text-gray-500`) and have limited accessibility cues (no skip link, listbox/activedescendant not fully wired).
- **MDX styles**: `mdx-components` use legacy amber/slate colors and custom gradients rather than tokens; `globals.css` prose styles partially align but are not consistent with MDX components.
- **Design tokens**: `globals.css` includes invalid OKLCH values (`28.%`, `14.%`) that need correction to avoid unpredictable rendering.

## Route-by-route notes

### `/` (Home)
- **Status**: Mostly aligned with tokens and modern palette.
- **Notes**: Buttons and cards already match; keep as reference for token usage.

### `/projects`
- **Status**: Aligned with tokens; consistent with home.
- **Notes**: Good candidate for baseline card/CTA styles.

### `/search`
- **Status**: Mostly tokenized, but minor drift.
- **Issues**:
  - Uses `text-gray-500` for search states; should use `text-muted-foreground`.
  - Search input + chips are fine, but accessible hinting can improve (focus styling, ARIA).

### `/posts` (Index)
- **Status**: Legacy palette.
- **Issues**:
  - Hard-coded gradients + amber/slate colors.
  - Cards/tags do not match tokenized card/chip styles.
  - CTA (“Browse tags”) uses custom style not shared with button variants.

### `/posts/tags`
- **Status**: Legacy palette.
- **Issues**:
  - Hard-coded amber tokens and manual border/hover styling.
  - Chip sizing/spacing inconsistent with other tags/chips across site.

### `/posts/tag/[tag]`
- **Status**: Legacy palette.
- **Issues**:
  - Same palette drift as `/posts`.
  - Tag list uses custom chip styling; card hover styles differ from `/projects`.

### `/posts/[slug]`
- **Status**: Legacy palette + mixed tokens.
- **Issues**:
  - Hero, tag pills, navigation cards, and sidebar use amber/slate styles.
  - MDX components conflict with the token palette (custom code block gradients, amber chips).
  - Structured data for SEO is missing (should render JSON-LD).

### `/apps` (Index)
- **Status**: Legacy palette.
- **Issues**:
  - Hard-coded background gradients and amber/slate colors.
  - Cards and metadata layout diverge from tokenized card patterns.

### `/apps/[slug]`
- **Status**: Legacy palette.
- **Issues**:
  - CTA/button styles partially modernized but still use legacy colors.
  - Feature list + screenshot styling could reuse shared tokens.

### Global navigation + search dropdown
- **Status**: Mostly tokenized.
- **Issues**:
  - Dropdown uses `text-gray-500` and ad-hoc focus states; should align with palette.
  - Accessibility improvements needed for listbox/combobox semantics.
  - Missing skip link to main content for keyboard users.

### MDX components (`mdx-components.tsx`)
- **Status**: Legacy palette.
- **Issues**:
  - Code block colors and chip accents use hard-coded amber/slate instead of tokens.
  - Image wrappers and blockquotes use custom gradients not aligned with global prose styles.

## Priority recommendations
- **P1**: Fix invalid OKLCH tokens + ensure base theme values are valid.
- **P1**: Restyle `/posts*` and `/apps*` to align with tokens.
- **P1**: Restyle MDX components to align with tokens.
- **P2**: Search UX improvements (accessibility + highlight/snippet rendering).
- **P2**: Add sitemap/robots for crawlability.
- **P2**: Add Web Vitals telemetry to Application Insights.
- **P2**: Add security headers/CSP.

## Visual QA checklist
Use this checklist after implementation to verify consistency and regressions.

### Global
- [ ] Focus rings visible and consistent (keyboard tabbing).
- [ ] CTAs use shared button variants; no unique ad-hoc button styles.
- [ ] Cards have consistent radius, border, and hover lift.
- [ ] Chips/tags are consistent across posts/apps/projects/search.
- [ ] Typography scale follows the modernization plan (headings, body, meta).
- [ ] Gradients and glow accents appear only where intended.

### Home (`/`)
- [ ] Hero text wraps cleanly at small widths.
- [ ] Primary CTA and secondary CTA have correct hierarchy.

### Projects (`/projects`)
- [ ] Cards use tokenized colors and hover styles.
- [ ] “Featured” vs “Recent” sections are visually distinct but consistent.

### Search (`/search` + dropdown)
- [ ] Dropdown shows keyboard hints, highlights, and focus state.
- [ ] `/search` results show matched snippets/highlights.
- [ ] Empty-state messaging is clear and consistent.

### Posts (`/posts`, `/posts/tags`, `/posts/tag/[tag]`)
- [ ] Background, cards, tags, and CTAs use tokenized colors.
- [ ] Dates and metadata remain legible at small widths.

### Post detail (`/posts/[slug]`)
- [ ] Hero metadata, tags, and CTA links align with tokens.
- [ ] MDX content (code blocks, tables, images, blockquotes) matches palette.
- [ ] Previous/next cards match global card style.
- [ ] JSON-LD is present in page HTML.

### Apps (`/apps`, `/apps/[slug]`)
- [ ] Cards, metadata, and CTAs align with tokens.
- [ ] Feature list and screenshots render cleanly on mobile.

## Follow-up candidates (create tasks if discovered)
- Content-level improvements (new copy or new visuals) beyond token changes.
- Additional accessibility audits (ARIA landmarks, label associations).
- Performance tuning (image sizes, suspense boundaries, cache directives).
