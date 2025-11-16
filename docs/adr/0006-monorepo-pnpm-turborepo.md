# ADR 0006: Monorepo with PNPM Workspaces and TurboRepo

**Date**: 2025-11-16  
**Status**: Accepted  
**Deciders**: Engineering Team

## Context

The platform consists of multiple related packages: the main Next.js app, shared configuration, CLI tools, and potentially shared UI components. We needed a repository structure that enables:
- Code sharing without publishing to npm
- Independent versioning where needed
- Fast, cached builds
- Clear dependency relationships

## Decision

We use a **monorepo** managed by **PNPM workspaces** with **TurboRepo** for task orchestration and caching.

## Rationale

**Why Monorepo:**
- Share code (ESLint configs, TypeScript configs) without npm publishing
- Atomic commits across related changes
- Single source of truth for dependencies
- Easier refactoring across package boundaries
- Better developer experience (single `git clone`)

**Why PNPM Workspaces:**
- Fastest package manager (benchmarks vs npm/yarn)
- Strict dependency resolution prevents phantom dependencies
- Efficient disk usage with content-addressable storage
- Native monorepo support via `pnpm-workspace.yaml`
- Compatible with all npm packages

**Why TurboRepo:**
- Intelligent task caching (local + remote)
- Parallel task execution
- Understands workspace dependencies
- Simple configuration (`turbo.json`)
- Owned by Vercel (same team as Next.js)

**Workspace Structure:**
```
/
├── app/                    # Main Next.js application
├── packages/
│   ├── config/             # Shared ESLint + tsconfig
│   ├── scripts/            # CLI tools (@klaboworld/scripts)
│   └── ui/                 # Shared UI components (future)
└── pnpm-workspace.yaml     # Workspace definition
```

**Alternatives Considered:**
1. **Polyrepo** - Simpler but requires npm publishing; harder to coordinate changes
2. **Yarn Workspaces** - Similar to PNPM but slower; Classic vs Berry confusion
3. **npm Workspaces** - Built-in but slower than PNPM; weaker link protocol
4. **Nx** - More features than TurboRepo but steeper learning curve; more configuration
5. **Lerna** - Legacy solution; TurboRepo is the modern successor

## Consequences

**Positive:**
- Share configs without duplication (`@klaboworld/config`)
- Cache builds across workspaces (TurboRepo)
- Fast installs with PNPM's efficient storage
- `pnpm --filter <workspace>` runs commands in specific packages
- Atomic versioning for related changes

**Negative:**
- Learning curve for developers new to monorepos
- Must understand workspace: protocol and `pnpm --filter`
- TurboRepo cache can occasionally need clearing
- More complex than single-package setup

**Mitigations:**
- Document common commands in README and AGENTS.md
- `Justfile` abstracts common operations (`just lint`, `just test`)
- `.nvmrc` and `mise` ensure consistent Node/PNPM versions
- CI caches TurboRepo builds for faster runs

## Implementation Details

**Key Commands:**
```bash
pnpm install                           # Install all workspace dependencies
pnpm --filter app dev                  # Run dev server in app workspace
pnpm --filter @klaboworld/scripts run new-post  # Run script
pnpm turbo lint                        # Run lint in all workspaces with caching
pnpm turbo test                        # Run tests in all workspaces with caching
```

**Workspace Protocol:**
- `"@klaboworld/config": "workspace:*"` in `package.json` links to local package
- Changes to `packages/config` automatically affect `app` without republishing
