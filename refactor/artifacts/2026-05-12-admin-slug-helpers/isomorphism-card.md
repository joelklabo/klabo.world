# Isomorphism Card — Make admin slug callbacks non-null by construction

## Change
- Normalize admin slug helper callback parameter types to `NonNullable<TResource>`.
- Remove redundant `!post` guards from `app/src/app/drafts/[slug]/page.tsx` now that the helper already performs the missing-resource branch.

## Equivalence contract
- **Inputs covered:** admin draft/post/app/dashboard detail/edit page render paths via `runAdminSlugPage` and `runAdminSlugMetadata`.
- **Ordering preserved:** unchanged; callbacks still execute after successful slug lookup and within the same Next.js admin session wrapper.
- **Error semantics:** unchanged:
  - missing resource continues to hit `runAdminSlugResource`’s missing branch.
  - public-facing `notFound()` and metadata fallback behavior remain intact.
- **Side effects:** unchanged.
- **Short-circuit behavior:** unchanged; missing resource exits before callback invocation as before.
- **Type contract:** callback no longer receives nullable resources, preserving runtime behavior and making impossible states unrepresentable.

## Verification
- [x] Verified helper source type updates are internally consistent.
- [x] Verified draft metadata/page no longer carry redundant inline `!post` checks.
- [x] Kept behavior for missing draft/edit targets delegated to `runAdminSlugResource`.
