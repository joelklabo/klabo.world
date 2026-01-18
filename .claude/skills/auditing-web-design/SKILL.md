---
name: auditing-web-design
description: Audits UI code for accessibility, performance, and UX compliance. Use when reviewing components, checking accessibility, or validating UI before shipping.
invocation: user
arguments: "[file-or-directory]"
---

# Auditing Web Design

Systematic UI audit using Vercel's Web Interface Guidelines.

## Contents
- [Quick Audit](#quick-audit)
- [Accessibility](#accessibility)
- [Forms](#forms)
- [Performance](#performance)
- [Animation](#animation)
- [Typography](#typography)
- [Anti-Patterns](#anti-patterns)
- **References:**
  - [references/full-checklist.md](references/full-checklist.md) - Complete 100+ rule checklist

## Quick Audit

Run these checks on any component:

```bash
# 1. Accessibility snapshot
browser_snapshot  # Check for missing labels, focus issues

# 2. Console errors
browser_console_messages  # Check for warnings

# 3. Visual inspection
browser_take_screenshot  # Capture current state
```

### Priority Checks

| Check | How |
|-------|-----|
| Icon buttons have labels | `aria-label` on every icon-only button |
| Form inputs labeled | `<label>` or `aria-label` on all inputs |
| Focus visible | Tab through - every element visible |
| Images sized | `width`/`height` on all `<img>` |
| Lists virtualized | >50 items? Use virtualization |

## Accessibility

### Required

| Element | Requirement |
|---------|-------------|
| Icon buttons | `aria-label="descriptive text"` |
| Form inputs | `<label>` with `htmlFor` or `aria-label` |
| Interactive elements | Keyboard handlers (`onKeyDown`) |
| Async updates | `aria-live="polite"` |
| Headings | Follow hierarchy (h1 → h2 → h3) |

### Focus States

```css
/* Good */
.btn:focus-visible {
  @apply ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-900;
}

/* Bad */
.btn:focus {
  outline: none;  /* Never without replacement */
}
```

**Rules:**
- Never `outline-none` without visible replacement
- Prefer `:focus-visible` over `:focus`
- Contrast ratio ≥ 3:1 for focus indicators

## Forms

| Input | Requirements |
|-------|--------------|
| Email | `type="email"`, `autocomplete="email"` |
| Password | `type="password"`, `autocomplete="current-password"` |
| Name | `autocomplete="name"` |
| Search | `type="search"`, disable spellcheck |

### Validation Pattern

```tsx
// Inline errors, focus first error
<input aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
{error && <span id={`${id}-error`} role="alert">{error}</span>}
```

**Rules:**
- Submit button enabled until request starts
- Errors inline, not toast/modal
- Focus first error on submission
- Block autocomplete on non-auth fields: `autocomplete="off"`

## Performance

### Images

```tsx
// Above fold
<Image src={src} width={800} height={600} priority />

// Below fold
<Image src={src} width={800} height={600} loading="lazy" />
```

**Rules:**
- Always explicit `width`/`height`
- `priority` for above-fold, `loading="lazy"` below
- Use Next.js `<Image>` for automatic optimization

### Lists

```tsx
// Bad: rendering 1000 items
{items.map(item => <Item key={item.id} {...item} />)}

// Good: virtualized
<VirtualList items={items} itemHeight={48} />
```

**Rule:** Virtualize lists > 50 items

### Preloading

```tsx
// In <head>
<link rel="preconnect" href="https://cdn.example.com" />
<link rel="preload" href="/fonts/custom.woff2" as="font" crossOrigin="" />
```

## Animation

### Required

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Rules

| Do | Don't |
|----|-------|
| Animate `transform`, `opacity` | Animate `width`, `height`, `top` |
| Use specific properties | `transition: all` |
| Make interruptible | Lock user during animation |

## Typography

| Pattern | Implementation |
|---------|----------------|
| Ellipsis | Use `…` character, not `...` |
| Quotes | Curly `""` not straight `""` |
| Numbers | `font-variant-numeric: tabular-nums` |
| Headings | `text-wrap: balance` |
| Non-breaking | `&nbsp;` between number and unit |

## Anti-Patterns

**Flag these immediately:**

| Pattern | Problem | Fix |
|---------|---------|-----|
| `outline: none` alone | Breaks keyboard navigation | Add `ring-*` replacement |
| `transition: all` | Performance, unintended effects | Specify properties |
| `onPaste` preventDefault | Breaks password managers | Remove handler |
| Zoom-disabling viewport | Accessibility violation | `user-scalable=yes` |
| Click handler on non-button | Not keyboard accessible | Use `<button>` |
| Hardcoded date formats | i18n issues | Use `Intl.DateTimeFormat` |

## Verification

After audit:

1. **Tab test** - Every interactive element reachable and visible
2. **Screen reader** - VoiceOver/NVDA announces correctly
3. **Console** - No warnings or errors
4. **Lighthouse** - Accessibility score ≥ 90
