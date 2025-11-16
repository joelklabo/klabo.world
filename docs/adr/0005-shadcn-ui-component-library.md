# ADR 0005: shadcn/ui for Component Library

**Date**: 2025-11-16  
**Status**: Accepted  
**Deciders**: Engineering Team

## Context

The platform needs a consistent, accessible, and customizable component library for UI elements (buttons, forms, cards, dialogs, etc.). We needed a solution that provides:
- Tailwind CSS integration
- Full customization control (not a black box)
- TypeScript support
- Accessibility (WCAG 2.1 AA)
- Copy-paste workflow (not npm dependencies)

## Decision

We adopted **shadcn/ui** as our component library approach, copying components into `app/src/components/ui/` and customizing them as needed.

## Rationale

**Why shadcn/ui:**
- Components are owned by us (copied into codebase, not npm packages)
- Built on Radix UI primitives (excellent accessibility)
- Designed for Tailwind CSS (perfect fit for our stack)
- Full customization - edit the source directly
- TypeScript native with proper types
- `components.json` configures paths and preferences
- Active community and regular updates

**Why Copy-Paste vs NPM Package:**
- No black box - we see and control all component code
- Easy to customize without fighting against abstractions
- No version conflicts or breaking changes from updates
- Smaller bundle size (tree-shake unused components)
- Learn patterns by reading component source

**Components Added So Far:**
- `button.tsx` - Button primitive with variants
- `card.tsx` - Card container with header/content/footer
- `input.tsx` - Text input with consistent styling and validation states
- `textarea.tsx` - Multiline text input
- `label.tsx` - Form labels with proper accessibility
- `select.tsx` - Dropdown select with proper keyboard navigation
- `form.tsx` - Form context with react-hook-form integration

**Integration:**
- `app/components.json` configures shadcn/ui settings
- `app/src/lib/utils.ts` provides `cn()` utility for class merging
- Uses `class-variance-authority` for variant management
- Styled with Tailwind 4 design tokens

**Alternatives Considered:**
1. **Material-UI (MUI)** - Heavy bundle; opinionated design; harder to customize
2. **Chakra UI** - Great DX but CSS-in-JS conflicts with Tailwind
3. **Radix UI (direct)** - Unstyled primitives require more work; shadcn builds on these
4. **Headless UI** - Good primitives but less comprehensive than Radix
5. **Custom components from scratch** - Reinventing the wheel; accessibility is hard

## Consequences

**Positive:**
- Full control over component implementation
- Can modify components for specific use cases
- No dependency version conflicts
- Learn React patterns by reading source
- Accessibility handled by Radix primitives
- Consistent with Tailwind design language

**Negative:**
- Manual updates required (copy new versions from shadcn/ui)
- More code in our repository (not a problem for us)
- Team must understand component internals for deep customization
- Requires discipline to avoid diverging from shadcn patterns

**Mitigations:**
- Document component customizations in comments
- Periodically check shadcn/ui for updates to components we use
- Use `pnpm dlx shadcn@latest add <component>` to add new components
- Keep customizations minimal and well-documented
- Prefer composition over modification when possible

## Next Steps

**Component Refactoring Progress:**
- ✅ `/admin/compose` - Refactored to use Input, Textarea, Label, Button
- ✅ `/admin/contexts/new` - Refactored to use Input, Textarea, Label, Button
- ✅ `/admin/apps/new` - Refactored to use Input, Textarea, Label, Button

**Remaining Components to Add** (as needed):
- Dialog/Modal - For confirmations and popups
- Dropdown Menu - For action menus
- Tabs - For organizing dashboard content
- Toast notifications - For success/error messages
- Table - For data listings
- Badge - For tags and status
- Avatar - For user profiles
