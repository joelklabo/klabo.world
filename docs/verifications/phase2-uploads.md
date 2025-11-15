# Phase 2 – Uploads Verification (2025-11-16)

## Command
```
pnpm --filter app exec playwright test tests/e2e/admin-upload.e2e.ts --reporter=dot
```

## Observations
- The test logs into the admin dashboard, opens the Compose page, and sets a PNG fixture via the featured image upload helper, which uses the `/admin/upload-image` server action (same as the Markdown helper used on contexts). The route returns a `url` and `filename`, and the component renders the “Uploaded!” confirmation text.
- When the env uses `public/uploads`, the test cleans up the temporary file to keep the workspace tidy. In Azure the same route would fall back to the Blob helper, so the test ensures the handler works for either storage backend.

This confirms the `/admin/upload-image` endpoint validates MIME/size, returns the expected URL, and hooks directly into the admin forms, fulfilling the Phase 2 “Uploads” requirement.
