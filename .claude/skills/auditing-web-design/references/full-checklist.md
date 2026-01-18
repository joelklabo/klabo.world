# Full Web Design Audit Checklist

Based on Vercel Web Interface Guidelines.

## Accessibility (A11y)

- [ ] Icon-only buttons have `aria-label`
- [ ] Form controls have `<label>` or `aria-label`
- [ ] Interactive elements have keyboard handlers
- [ ] Favor semantic HTML over ARIA
- [ ] Async updates use `aria-live="polite"`
- [ ] Headings follow hierarchy
- [ ] Skip links for main content

## Focus States

- [ ] Interactive elements have visible focus indicators
- [ ] Using `focus-visible:ring-*` (or equivalent)
- [ ] No `outline-none` without replacement
- [ ] Prefer `:focus-visible` over `:focus`
- [ ] Focus contrast ratio ≥ 3:1

## Forms

- [ ] Inputs have `autocomplete` attribute
- [ ] Inputs have meaningful `name` attribute
- [ ] Inputs have correct `type` attribute
- [ ] Non-auth fields use `autocomplete="off"`
- [ ] Spellcheck disabled on emails/codes
- [ ] Checkboxes/radios have single hit targets
- [ ] Submit buttons enabled until request
- [ ] Errors appear inline
- [ ] First error focused on submission

## Animation

- [ ] `prefers-reduced-motion` honored
- [ ] Only animating `transform`/`opacity`
- [ ] No `transition: all`
- [ ] Animations interruptible by user input

## Typography

- [ ] Using ellipsis character `…`
- [ ] Using curly quotes `""`
- [ ] `font-variant-numeric: tabular-nums` for number columns
- [ ] `text-wrap: balance` on headings
- [ ] Non-breaking spaces where needed

## Content Handling

- [ ] Containers handle long content
- [ ] Flex children have `min-w-0`
- [ ] Empty states handled explicitly
- [ ] Text truncation where appropriate

## Images

- [ ] Explicit `width`/`height` on all images
- [ ] `loading="lazy"` below fold
- [ ] `priority` on above-fold images
- [ ] Alt text on all images
- [ ] Using Next.js `<Image>` component

## Performance

- [ ] Lists > 50 items virtualized
- [ ] No layout reads in render
- [ ] DOM operations batched
- [ ] CDN domains preconnected
- [ ] Critical fonts preloaded

## Navigation & State

- [ ] URLs reflect state (filters, tabs)
- [ ] Deep-linking works
- [ ] Destructive actions need confirmation
- [ ] Back button works correctly

## Touch & Interaction

- [ ] `touch-action: manipulation` applied
- [ ] `-webkit-tap-highlight-color` intentional
- [ ] `overscroll-behavior: contain` in modals
- [ ] Touch targets ≥ 44px

## Safe Areas & Layout

- [ ] Full-bleed uses `env(safe-area-inset-*)`
- [ ] Scrollbars managed intentionally
- [ ] Horizontal scroll prevented

## Dark Mode

- [ ] `color-scheme: dark` on `<html>`
- [ ] Explicit `background-color` on `<select>`
- [ ] Explicit `color` on `<select>`
- [ ] Theme toggle works correctly

## Internationalization

- [ ] Using `Intl.DateTimeFormat`
- [ ] Using `Intl.NumberFormat`
- [ ] No hardcoded date/number formats
- [ ] RTL support if needed

## Hydration Safety

- [ ] Controlled inputs have `onChange`
- [ ] Uncontrolled inputs use `defaultValue`
- [ ] Date/time rendering guarded
- [ ] No hydration mismatches

## Content & Copy

- [ ] Active voice
- [ ] Title Case headings
- [ ] Numerals for counts
- [ ] Specific button labels (not "Submit")
- [ ] Error messages include fixes
- [ ] Second person perspective

## Anti-Patterns to Flag

- [ ] No zoom-disabling viewport
- [ ] No `onPaste` preventDefault
- [ ] No `transition: all`
- [ ] No `outline-none` without replacement
- [ ] No non-semantic click handlers
- [ ] No unlabeled inputs/icons
- [ ] No unmeasured images
- [ ] No unvirtualized large arrays
- [ ] No hardcoded formats
- [ ] No unjustified `autoFocus`
