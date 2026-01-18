# Design Tokens Reference

Complete token reference for klabo.world.

## Color Palette

### Zinc (Neutral)

| Token | Hex | Use |
|-------|-----|-----|
| `zinc-950` | #09090b | Page background |
| `zinc-900` | #18181b | Surface background |
| `zinc-800` | #27272a | Elevated/hover |
| `zinc-700` | #3f3f46 | Borders |
| `zinc-600` | #52525b | Disabled |
| `zinc-500` | #71717a | Subtle text |
| `zinc-400` | #a1a1aa | Muted text |
| `zinc-300` | #d4d4d8 | Body text |
| `zinc-100` | #f4f4f5 | Primary text |

### Amber (Accent)

| Token | Hex | Use |
|-------|-----|-----|
| `amber-500` | #f59e0b | Primary accent |
| `amber-400` | #fbbf24 | Hover accent |
| `amber-500/10` | rgba | Accent background |
| `amber-500/30` | rgba | Accent border |

### Semantic

| Token | Color | Use |
|-------|-------|-----|
| Success | `green-500` | Success states |
| Warning | `yellow-500` | Warning states |
| Error | `red-500` | Error states |
| Info | `blue-500` | Info states |

## Spacing Scale

```css
/* Tailwind utility classes */
0    → 0px
0.5  → 2px
1    → 4px      /* xs */
2    → 8px      /* sm */
3    → 12px
4    → 16px     /* md */
5    → 20px
6    → 24px     /* lg */
8    → 32px     /* xl */
10   → 40px
12   → 48px     /* 2xl */
16   → 64px
20   → 80px
24   → 96px
```

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `rounded-sm` | 2px | Subtle rounding |
| `rounded` | 4px | Default |
| `rounded-md` | 6px | Buttons, inputs |
| `rounded-lg` | 8px | Cards, modals |
| `rounded-full` | 9999px | Pills, avatars |

**Avoid:** `rounded-xl`, `rounded-2xl`, `rounded-3xl`

## Shadows

| Token | Use |
|-------|-----|
| `shadow-sm` | Subtle depth |
| `shadow` | Cards (rarely) |

**Avoid:** `shadow-lg`, `shadow-xl` (too prominent for dark theme)

## Typography

### Font Families

```css
--font-sans: /* System font stack */
--font-mono: 'JetBrains Mono', monospace
```

### Font Sizes

| Token | Size | Line Height |
|-------|------|-------------|
| `text-xs` | 12px | 16px |
| `text-sm` | 14px | 20px |
| `text-base` | 16px | 24px |
| `text-lg` | 18px | 28px |
| `text-xl` | 20px | 28px |
| `text-2xl` | 24px | 32px |
| `text-3xl` | 30px | 36px |
| `text-4xl` | 36px | 40px |

### Font Weights

| Token | Weight | Use |
|-------|--------|-----|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Emphasis |
| `font-semibold` | 600 | Subheadings |
| `font-bold` | 700 | Headings |

## Transitions

```css
/* Default */
transition-colors duration-150

/* Interactive elements */
transition-all duration-200

/* Page transitions */
transition-opacity duration-300
```

**Never use:** `transition: all` in CSS (only Tailwind `transition-all` with duration)

## Z-Index Scale

| Token | Value | Use |
|-------|-------|-----|
| `z-0` | 0 | Base |
| `z-10` | 10 | Overlapping elements |
| `z-20` | 20 | Dropdowns |
| `z-30` | 30 | Fixed headers |
| `z-40` | 40 | Modals |
| `z-50` | 50 | Toasts |

## Breakpoints

| Token | Min Width |
|-------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

## Container

```tsx
<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Blog content */}
</div>

<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Full-width content */}
</div>
```
