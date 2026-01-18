---
name: frontend-design
description: Creates distinctive, production-grade frontend interfaces with high design quality. Use when building UI components, pages, blog elements, or MDX content. Generates creative, polished code that avoids generic AI aesthetics.
invocation: auto
---

# Frontend Design

Create visually striking, memorable interfaces that avoid "AI slop" aesthetics.

## Contents
- [Design Thinking](#design-thinking)
- [Typography](#typography)
- [Color & Theme](#color--theme)
- [Motion](#motion)
- [Layout](#layout)
- [Anti-Patterns](#anti-patterns)
- [Quick Reference](#quick-reference)
- **References:**
  - [references/aesthetic-directions.md](references/aesthetic-directions.md) - Design direction examples
  - [references/mdx-patterns.md](references/mdx-patterns.md) - MDX component patterns

## Design Thinking

Before coding, commit to a **BOLD aesthetic direction**:

1. **Purpose** - What problem does this interface solve?
2. **Tone** - Pick an extreme: brutally minimal, maximalist, retro-futuristic, editorial, organic
3. **Memorable element** - What's the one unforgettable thing?

> Bold maximalism and refined minimalism both work—the key is intentionality, not intensity.

## Typography

| Do | Don't |
|----|-------|
| Distinctive, characterful fonts | Generic fonts (Inter, Roboto, Arial) |
| Pair display + body fonts | Single system font |
| `font-variant-numeric: tabular-nums` for numbers | Mixed number alignments |
| `text-wrap: balance` on headings | Widows/orphans |

**klabo.world stack:** Use `@next/font` for font optimization.

## Color & Theme

| Principle | Implementation |
|-----------|----------------|
| Commit to cohesive aesthetic | CSS variables in `:root` |
| Dominant + sharp accents | Avoid evenly-distributed palettes |
| Dark mode intentional | `color-scheme: dark` on `<html>` |
| Explicit backgrounds | Never rely on browser defaults |

```css
/* Pattern: High contrast accent */
--bg: hsl(0 0% 7%);
--fg: hsl(0 0% 93%);
--accent: hsl(38 92% 50%);  /* amber-500 */
```

## Motion

| Priority | Technique |
|----------|-----------|
| **High** | Page load reveals with `animation-delay` stagger |
| **High** | Hover states that surprise |
| **Medium** | Scroll-triggered animations |
| **Low** | Continuous ambient motion |

**Rules:**
- Animate only `transform` / `opacity`
- Honor `prefers-reduced-motion`
- Never use `transition: all`
- CSS-only preferred; Motion library for React when needed

## Layout

| Pattern | Use For |
|---------|---------|
| Asymmetry | Breaking visual monotony |
| Overlap | Creating depth |
| Grid-breaking | Focal elements |
| Generous negative space | Editorial feel |
| Controlled density | Data-rich interfaces |

**Tailwind patterns:**
```html
<!-- Overlap -->
<div class="relative -mt-12 z-10">

<!-- Grid break -->
<div class="col-span-full md:-mx-8">

<!-- Generous space -->
<section class="py-24 md:py-32">
```

## Anti-Patterns

**NEVER use:**
- ❌ Inter, Roboto, Arial, system fonts
- ❌ Purple gradients on white backgrounds
- ❌ Cookie-cutter card grids
- ❌ Generic hero sections
- ❌ Predictable layouts
- ❌ Same aesthetic across generations

**Signs of AI slop:**
- Every button is rounded-lg with shadow-sm
- Blue-to-purple gradient everything
- Excessive whitespace with no purpose
- "Modern" meaning "looks like every Vercel template"

## Quick Reference

| Element | Distinctive Choice |
|---------|-------------------|
| Buttons | Custom shapes, borders, hover effects |
| Cards | Asymmetric, overlapping, varied sizes |
| Headings | Large scale contrast, unusual weight |
| Images | Creative crops, borders, shadows |
| Backgrounds | Gradients, noise, patterns, textures |

## Verification

After creating UI:

1. **Screenshot test** - Would this be mistaken for AI-generated?
2. **Memorable test** - What's the one thing someone would remember?
3. **Consistency test** - Does it match the chosen aesthetic direction?
4. **Technical test** - Console errors? Accessibility issues?

Use Playwright MCP to capture before/after:
```
browser_snapshot → make changes → browser_snapshot → compare
```
