# Legacy Content Export Verification (2025-11-15)

## Command
```
pnpm --filter @klaboworld/scripts run export-legacy
```

## Observations
- All 12 legacy posts now exist under `content/posts/*.mdx` and keep their original front matter (the script validated each file contains the required keys before writing).
- Both legacy contexts were exported into `content/contexts/*.mdx` with their metadata intact.
- `vicechips.json` was copied into `content/apps/`, and the script ignored `.bak` and non-JSON files.
- Exported files are sanitized to drop any embedded null characters so Contentlayer can parse them without errors.

This proves the new migration script can be run safely during the feature-parity Phase 0 transition; rerun it whenever the legacy source changes and add the output to the docs if counts change.
