# Cutover Checklist for Coding Partner

This checklist summarizes the final verification work (Phase 5) before switching klabo.world to the new Next.js stack. Share it with the coding partner/stakeholder for sign-off.

## ✅ Completed
- Content parity (file counts, visual spot checks) confirmed in `docs/verifications/phase5-data-validation.md` and `phase5-visual-checks.md`.
- Performance/load test (`k6 run scripts/load-smoke.js`) passes against the deployed Next.js app (`docs/verifications/phase5-load-test.md`).
- Deployment smoke script (`scripts/deploy-smoke.sh`) hits `/`, `/posts`, `/apps`, `/search`, `/api/health` and logs details.
- Cutover checklist (`docs/phase5-cutover-checklist.md`) prepared with pre-/post-switch steps and rollback plan.

## 🔜 Pending
- Stakeholder approval recorded in `docs/verifications/phase5-stakeholder-approval.md` (fill in once approved).
- DNS/front-door update to route `https://klabo.world` to the Next.js App Service.
- Freeze the legacy Swift App Service after cutover.

Keep this file in sync with the verification docs when new approvals arrive.
