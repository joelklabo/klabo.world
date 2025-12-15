# Landing Page UX Review (Deep Pass)

This document captures a deep UX review of `/` and the resulting simplification work. The goal is to reduce cognitive load, remove non-essential UI, and present projects clearly and beautifully.

## Core UX goals

1. **One primary action** per section (avoid competing CTAs).
2. **Reduce cognitive load** (fewer sections, fewer colors, fewer competing patterns).
3. **Public-first IA** (admin/observability entry points should not be primary nav for most visitors).
4. **Consistency** (use design tokens + shadcn primitives across public + admin surfaces).
5. **Reliability** (GitHub content should not break rendering or make pages flaky in tests).

## What we removed (why)

### Admin/Dashboards promoted on `/`

Admin and dashboards are useful for operators, not for first-time visitors. Putting them in the hero and in the global nav increases decision fatigue and dilutes the message.

### Stats + highlight cards on `/`

Counts and secondary “feature” cards add visual weight without increasing comprehension. On a content + projects site, the fastest path is:

- show what the site is
- show recent writing
- show recent projects

Everything else can live on dedicated index pages.

### Tag cloud on `/`

Tag clouds are visually busy and do not help a new visitor understand what to do next. Tag discovery belongs on `/posts` (or a dedicated tags page).

## New structure (what we kept)

The landing page is now intentionally small:

- **Hero**: one sentence + two CTAs (Writing, Projects)
- **Recent articles**: three cards
- **Recent GitHub work**: a small curated grid + links to Apps and GitHub profile

## GitHub projects presentation

### Design approach

Project cards are intentionally “quiet”:

- repo identity (name + fullName)
- description (line-clamped)
- language + stars + updated date

No heavy animation, no multiple CTAs per card; the card itself links to GitHub.

### Data + reliability

To avoid external network flakiness:

- Prefer pinned repos (GraphQL) when `GITHUB_TOKEN` is present.
- Fall back to public recent repos (REST).
- Fall back to a cached snapshot in `app/data/github/<owner>.json` if GitHub is unavailable.

## Interaction test coverage

Playwright coverage ensures key interactions remain correct:

- Global nav links (Home → Writing → Projects)
- Global search dropdown interaction
- Home hero CTAs (navigate to Writing and Projects)
- Home projects section renders and can navigate to Projects

## Follow-ups to consider

- Consider unifying the public page visual language further (`/apps`, post detail backgrounds) so the whole site feels like one product.
- Consider adding a lightweight “About”/“Now” page instead of packing identity into the hero.

