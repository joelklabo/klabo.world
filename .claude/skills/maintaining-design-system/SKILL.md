---
name: maintaining-design-system
description: Enforces consistent design tokens, patterns, and component styles. Use when building new components, reviewing UI consistency, or extracting patterns from existing code.
invocation: auto
---

# Maintaining Design System

Ensure design consistency across all UI by following established patterns.

## Contents
- [klabo.world System](#klaboworld-system)
- [Tokens](#tokens)
- [Component Patterns](#component-patterns)
- [Validation](#validation)
- **References:**
  - [references/tokens.md](references/tokens.md) - Full token reference

## klabo.world System

**Direction:** Editorial/Industrial hybrid
- Dark-first design
- Technical/code content focus
- Amber accent for highlights
- Dense information display

## Tokens

### Colors

```css
/* Background */
--bg-base: theme('colors.zinc.950');      /* Page background */
--bg-surface: theme('colors.zinc.900');    /* Cards, surfaces */
--bg-elevated: theme('colors.zinc.800');   /* Hover, focus */

/* Foreground */
--fg-base: theme('colors.zinc.100');       /* Primary text */
--fg-muted: theme('colors.zinc.400');      /* Secondary text */
--fg-subtle: theme('colors.zinc.500');     /* Tertiary text */

/* Accent */
--accent: theme('colors.amber.500');       /* Primary accent */
--accent-muted: theme('colors.amber.500/10'); /* Accent backgrounds */
```

### Spacing

| Scale | Value | Use |
|-------|-------|-----|
| xs | 4px | Icon padding |
| sm | 8px | Tight gaps |
| md | 16px | Default gap |
| lg | 24px | Section gap |
| xl | 32px | Major sections |
| 2xl | 48px | Page sections |

### Typography

| Element | Classes |
|---------|---------|
| Heading 1 | `text-4xl font-bold tracking-tight` |
| Heading 2 | `text-2xl font-semibold` |
| Heading 3 | `text-xl font-medium` |
| Body | `text-base text-zinc-300` |
| Small | `text-sm text-zinc-400` |
| Code | `font-mono text-sm` |

## Component Patterns

### Buttons

```tsx
// Primary
<button className="px-4 py-2 bg-amber-500 text-zinc-900 font-medium rounded-md hover:bg-amber-400 focus-visible:ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-900">
  Action
</button>

// Secondary
<button className="px-4 py-2 border border-zinc-700 text-zinc-100 rounded-md hover:bg-zinc-800 focus-visible:ring-2 ring-zinc-500 ring-offset-2 ring-offset-zinc-900">
  Action
</button>
```

### Cards

```tsx
// Standard card
<div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
  {content}
</div>

// Highlighted card
<div className="bg-zinc-900/50 border border-amber-500/30 rounded-lg p-4">
  {content}
</div>
```

### Callouts

```tsx
// Info (amber)
<div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg p-4">

// Warning (red)
<div className="bg-red-500/10 border-l-4 border-red-500 rounded-r-lg p-4">

// Success (green)
<div className="bg-green-500/10 border-l-4 border-green-500 rounded-r-lg p-4">
```

### Links

```tsx
// Inline link
<a className="text-amber-500 hover:underline">Link</a>

// Nav link
<a className="text-zinc-400 hover:text-zinc-100">Link</a>
```

### Code Blocks

```tsx
<pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
  <code className="text-sm font-mono text-zinc-300">{code}</code>
</pre>
```

## Validation

### Before Shipping

1. **Color check** - Only using defined palette
2. **Spacing check** - Only using scale values
3. **Pattern check** - Components match established patterns
4. **Dark mode** - Works in dark theme
5. **Consistency** - Matches existing similar components

### Violations to Fix

| Violation | Fix |
|-----------|-----|
| `text-gray-*` | Use `text-zinc-*` |
| Arbitrary colors | Use token |
| `rounded-xl` | Use `rounded-lg` or `rounded-md` |
| `shadow-lg` | Use `shadow-sm` or none |
| Non-standard spacing | Use scale |

### Command

```bash
# Check for violations
grep -r "text-gray\|bg-gray\|border-gray" src/
grep -r "rounded-xl\|rounded-2xl\|rounded-3xl" src/
```
