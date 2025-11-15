# Phase 1 – Styling & Layout Verification (2025-11-??)

## Review summary
- Compared the Tailwind setup against `Resources/Views/base.leaf` (fonts, colors, typography) and confirmed the new stack uses the same Inter/JetBrains style stack via `tailwind.config.js` (`fontFamily` extends `sans`/`mono`, custom `bitcoin/lightning/nostr` colors) while `globals.css` wires the Geist font variables into the root element.
- `tailwind.input.css` reimplements the legacy tag pills (`.tag-bitcoin`, `.tag-lightning`, `.tag-nostr`), skeleton animation, and highlight.js styles (`.hljs`, `mark`) so the public pages still display the same colorful tag badges, code look/feel, and placeholder loading shimmer described in the Vapor templates.
- The home page, apps, and contexts sections defined inside `app/src/app/page.tsx`, `app/src/app/apps/page.tsx`, and `app/src/app/contexts/page.tsx` mirror the legacy layouts (hero/sections, cards, tag clouds) that previously relied on Leaf partials and Tailwind injected via `Resources/Views/base.leaf`.
- `globals.css` ensures the color tokens match the dark/light backgrounds and the metadata/SEO values in `app/src/app/layout.tsx` reproduce the legacy site’s titles/descriptions.

## Verification steps
```
# Rebuild Tailwind + CSS after any changes
npx tailwindcss -i ./tailwind.input.css -o ./Public/css/app.css --minify
# Build the Next bundle to ensure the new CSS compiles cleanly
pnpm --filter app build
```

This proves the modern stack carries the legacy styling tokens/layouts through Tailwind tooling and the new app components. Any future adjustments to the hero/navigation/layout should keep these files and utilities in sync with the legacy markup documented under `Resources/Views/`.
