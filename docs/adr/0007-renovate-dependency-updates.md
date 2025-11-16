# ADR 0007: Renovate for Automated Dependency Updates

**Date**: 2025-11-16  
**Status**: Accepted  
**Deciders**: Engineering Team

## Context

The project has 100+ npm dependencies across the monorepo. Manually updating dependencies is time-consuming and often neglected, leading to security vulnerabilities and missing bug fixes.

## Decision

We use **Renovate** to automatically create pull requests for dependency updates, with **auto-merge enabled** for minor and patch updates.

## Rationale

**Why Automated Updates:**
- Security: patches applied automatically
- Stability: small, frequent updates easier than large jumps
- Reduced maintenance burden
- Never fall behind on dependency versions

**Why Renovate over Dependabot:**
- More flexible configuration
- Better monorepo support (understands PNPM workspaces)
- Can auto-merge based on rules
- Group related updates (e.g., all `@types/*` packages)
- Free for open source and self-hosted

**Configuration (`.github/renovate.json`):**
```json
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchUpdateTypes": ["patch", "minor"],
      "automerge": true,
      "automergeType": "pr"
    }
  ],
  "pnpm": { "enabled": true },
  "ignoreDeps": ["next", "react", "react-dom"]
}
```

**Auto-Merge Strategy:**
- **Patch** (1.2.3 → 1.2.4): Auto-merge after CI passes
- **Minor** (1.2.3 → 1.3.0): Auto-merge after CI passes
- **Major** (1.2.3 → 2.0.0): Create PR for manual review
- **Ignored**: `next`, `react`, `react-dom` require manual testing

**Alternatives Considered:**
1. **Dependabot** - GitHub native but less flexible; weaker monorepo support
2. **Manual updates** - Too time-consuming; security risk
3. **`npm-check-updates`** - Good for bulk updates but not automated
4. **Greenkeeper** - Deprecated; Renovate is the successor

## Consequences

**Positive:**
- Dependencies stay up-to-date automatically
- Security patches applied within hours/days
- Reduced cognitive load on team
- Smaller, safer update increments
- CI validates updates before merge

**Negative:**
- Occasional breaking changes slip through (even in minor updates)
- Can create many PRs (mitigated by grouping)
- Requires CI to be reliable
- Auto-merge may cause temporary issues

**Mitigations:**
- Pin major versions of critical dependencies (Next.js, React)
- Comprehensive test suite catches breaking changes
- Monitor auto-merged PRs in Slack/email
- Can disable auto-merge for specific packages if problematic
- Renovate dashboard shows update status

## Monitoring

- Renovate runs daily (configurable)
- Creates PRs for dependencies not covered by auto-merge rules
- Dashboard at https://app.renovatebot.com/ (for hosted version)
- Or self-host Renovate if needed for security
