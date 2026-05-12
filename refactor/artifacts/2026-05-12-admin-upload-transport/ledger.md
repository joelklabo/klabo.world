# LOC Ledger

## Scope
- Files modified:
  - `app/src/app/(admin)/components/app-form.tsx`
  - `app/src/app/(admin)/components/image-list-upload-field.tsx`
  - `app/src/app/(admin)/components/image-upload-field.tsx`
  - `app/src/app/(admin)/components/markdown-field.tsx`
  - `app/src/app/(admin)/components/post-form.tsx`
  - `app/src/app/(admin)/components/upload-helper.tsx`
- New file:
  - `app/src/app/(admin)/components/image-upload-transport.ts` (89 LOC)

## Diff summary
- Tracked files net: `37 insertions`, `107 deletions`
- Untracked helper: `89 insertions`, `0 deletions`
- Aggregate diff for tracked+new: `126 insertions`, `107 deletions` (net `+19`)

## Notes
- The objective was simplification/readability in upload handling and prop cleanup.
- Net gain comes from centralizing reusable upload + input-reset logic while removing duplicated inline handlers.

