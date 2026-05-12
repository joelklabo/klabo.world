# Isomorphism Card — Admin Upload Transport Consolidation

## Change
Collapse duplicated admin upload/image-list/clipboard upload code into one shared transport module.

## Equivalence contract
- Inputs covered: upload actions from `ImageUploadField`, `ImageListUploadField`, `MarkdownUploadHelper`, plus unchanged callsites in `AppForm` and `PostForm`.
- Ordering preserved: yes. File selection then single upload await path unchanged.
- Error semantics: unchanged shape for user-facing messages with explicit handling for:
  - 429 rate-limit (`statusCode === 429`, `Retry-After` parsing, `retryAfterSeconds` surfaced)
  - 400 invalid files (`Invalid file: ...`)
  - non-2xx errors (`Upload failed` fallback)
  - missing/invalid URL payload (`Upload failed`)
- Side effects: same state updates (`setStatus`, `setError`, `setRetryAfterSeconds`, `setValue`, `setUploadedPath`) and same clipboard copy side effect in markdown helper.
- Short-circuit behavior: preserved by early returns on non-`ok` results.
- Observable behavior: file input value reset remains centralized in `handleImageUploadChange`.

## Verification
- [x] `pnpm exec tsc --noEmit`
- [x] `pnpm exec eslint 'src/app/(admin)/components/app-form.tsx' 'src/app/(admin)/components/image-list-upload-field.tsx' 'src/app/(admin)/components/image-upload-field.tsx' 'src/app/(admin)/components/markdown-field.tsx' 'src/app/(admin)/components/post-form.tsx' 'src/app/(admin)/components/upload-helper.tsx'`
- [x] `pnpm exec vitest run` (20 passed)
- [x] `git diff --name-only` shows only targeted components + new helper
- [x] `pnpm exec jscpd ...` on target component set (no reported duplicate code blocks in focused target set)

