# ADR 0001: Use Next.js App Router for Server Architecture

**Date**: 2025-11-16  
**Status**: Accepted  
**Deciders**: Engineering Team

## Context

The klabo.world platform needed a modern web framework to replace the legacy Swift/Vapor backend while maintaining server-side rendering capabilities, strong TypeScript support, and a clear path for React 19 adoption.

## Decision

We adopted **Next.js 16 with the App Router** as our server framework.

## Rationale

**Why Next.js:**
- Industry-leading React framework with strong community support
- Built-in server-side rendering (SSR) and static generation (SSG)
- Excellent TypeScript support out of the box
- File-based routing reduces boilerplate
- Vercel's backing ensures long-term stability
- Strong ecosystem of compatible libraries

**Why App Router over Pages Router:**
- Server Components by default reduce client bundle size
- Better data fetching patterns (async server components)
- Streaming and Suspense support for improved UX
- Layout nesting provides better code organization
- Route handlers replace API routes with better type safety
- Server Actions eliminate the need for separate API endpoints for mutations
- Future-proof: App Router is the recommended approach going forward

**Alternatives Considered:**
1. **Remix** - Great DX but smaller ecosystem; less mature tooling
2. **Astro** - Excellent for content-heavy sites but less suitable for dynamic admin features
3. **SvelteKit** - Promising but smaller talent pool and ecosystem
4. **Continue with Swift/Vapor** - Would maintain tech debt; smaller talent pool; poor TypeScript integration

## Consequences

**Positive:**
- React Server Components reduce JavaScript sent to client
- Server Actions simplify form handling and mutations
- Streaming improves perceived performance
- Better code organization with nested layouts
- Type-safe routing with TypeScript
- Rich ecosystem for authentication, ORM, and observability

**Negative:**
- App Router is still stabilizing (some docs/examples use Pages Router)
- Learning curve for developers unfamiliar with Server Components
- Some libraries don't yet fully support App Router patterns
- Build times can be longer than simpler frameworks

**Mitigations:**
- Document App Router patterns in AGENTS.md
- Use `'use client'` directive sparingly and intentionally
- Leverage TurboRepo for faster incremental builds
- Monitor Next.js updates and follow upgrade path
