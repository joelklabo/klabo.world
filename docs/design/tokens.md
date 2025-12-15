# Design Tokens (Typography, Spacing, Radius)

This doc captures the current design primitives for klabo.world and proposes a small set of defaults to reduce visual drift across public + admin pages.

## Source of truth

- Colors + radii variables: `app/src/app/globals.css`
- UI primitives (shadcn): `app/src/components/ui/*`

## Typography

### Fonts

- Sans: Manrope (`--font-manrope`)
- Mono: JetBrains Mono (`--font-jetbrains-mono`)

### Recommended scale + patterns

- Eyebrow / section label: `text-xs font-semibold uppercase tracking-[0.3em] text-primary`
- Body copy: `text-sm text-muted-foreground`
- Card titles: `text-xl font-semibold text-foreground`
- Page titles: `text-3xl font-bold text-foreground`
- Hero titles (sparingly): `text-4xl font-bold md:text-5xl`

### Links + CTAs

- Prefer tokenized link colors: `text-primary hover:text-primary/80`
- Prefer `<Button />` over bespoke CTA class strings.

`Button` lives in `app/src/components/ui/button.tsx` and supports:

- Variants: `default`, `soft`, `outline`, `destructive`, `destructive-outline`, `ghost`, `link`
- Sizes: `xs`, `sm`, `default`, `lg`, `icon*`

## Spacing

### Layout

- Layout components own width + padding (e.g. max-width + `px-*`).
- Page bodies should generally use `space-y-6` and avoid re-applying outer padding that the layout already provides.
- Sections are typically `py-16`/`py-18` with `gap-6` grids.

### Cards

- Standard padding: `p-6` (dense: `p-5`)
- Standard border: `border-border/60`
- Standard surface: `bg-card`

## Radius

- Pills: `rounded-full` (nav items, tags, buttons)
- Cards: prefer `rounded-2xl` (use `rounded-3xl` only for hero/feature cards)
- Form controls: use shadcn defaults (`Input`/`Textarea`) rather than bespoke `rounded-lg` + custom focus rings.

## Drift to watch for

- Legacy usage of `tracking-widest` (prefer explicit `tracking-[...]` for consistency).
- Mixed card radii (`rounded-xl`, `rounded-2xl`, `rounded-3xl`) in older public pages.
- Hard-coded palette accents (`indigo`/`purple`/`cyan`) on some public sections; keep only when intentional.

