# ADR 0004: Contentlayer for File-First Content Management

**Date**: 2025-11-16  
**Status**: Accepted  
**Deciders**: Engineering Team

## Context

The platform manages blog posts, app showcases, and dashboards. We needed a content management approach that provides:
- Type-safe access to content in TypeScript
- MDX support for rich content with React components
- Git-backed version control
- Fast build times
- Schema validation

## Decision

We use **Contentlayer** to transform MDX/JSON files in `content/` into type-safe TypeScript objects with automatic schema validation.

## Rationale

**Why Contentlayer:**
- Generates TypeScript types from content schemas
- Compiles MDX to efficient JSX at build time
- Validates front matter against Zod schemas
- Filesystem = source of truth (Git history = audit log)
- Incremental builds for fast development
- Integrates seamlessly with Next.js

**Why File-First:**
- Git provides version control, branching, rollback
- Content is portable (not locked in a database)
- Developers can edit content with familiar tools (VSCode, Neovim)
- Easy to seed/reset content for testing
- CI can validate content before deployment
- Admin UI commits directly to GitHub for auditability

**Content Structure:**
```
content/
├── posts/*.mdx       # Blog posts
├── apps/*.json       # App showcases
└── dashboards/*.mdx  # Observability dashboards
```

**Alternatives Considered:**
1. **Traditional CMS (Contentful, Sanity)** - More features but requires API calls; vendor lock-in; cost
2. **Database-backed content** - Faster writes but loses Git history; harder to version
3. **Next.js native MDX** - Works but no schema validation; manual type generation
4. **Astro Content Collections** - Similar concept but tied to Astro framework
5. **MDX Bundler** - Lower-level; requires more manual setup

## Consequences

**Positive:**
- Type-safe content access: `allPosts`, `allContexts`, etc.
- Compile-time errors for invalid front matter
- Git history = content audit log
- Easy to export/import content
- Fast content queries (no database roundtrip)
- Hot reload in development

**Negative:**
- Build step required after content changes (mitigated by incremental builds)
- Large content volumes could slow builds (not a current concern)
- Contentlayer has some Node 24 compatibility warnings (non-blocking)
- Admin UI must commit to GitHub (requires `GITHUB_TOKEN`)

**Mitigations:**
- Admin server actions use `simple-git` to commit changes
- `pnpm contentlayer build` runs in CI and before Playwright tests
- Content schemas (`app/contentlayer.config.ts`) are documented
- GitHub token is optional for local development (manual Git workflow works)
- Monitor Contentlayer for updates; migrate to alternatives if project stalls
