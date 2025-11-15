# Phase 5 – Data Validation Snapshot

Date: 2025-11-15

## Goal
Ensure the migrated Contentlayer sources mirror the legacy Vapor `Resources/**` content before final cutover.

## Commands & Results
Executed from repo root:

```bash
find content/posts -name '*.mdx' | wc -l      # => 12
find Resources/Posts -name '*.md' | wc -l      # => 12
find content/apps -name '*.json' | wc -l       # => 1
find Resources/Apps -name '*.json' | wc -l     # => 1
find content/contexts -name '*.mdx' | wc -l    # => 2
find Resources/Contexts -name '*.md' | wc -l   # => 2
```

Counts match for posts, apps, and contexts, confirming the file-based migration stayed in sync with the legacy repo (no missing content).

## Next Steps
- Perform spot checks of rendered pages (compare `/posts/<slug>` across legacy vs Next.js) and document results.
- Run `k6 run scripts/load-smoke.js` against staging/production before final cutover.
