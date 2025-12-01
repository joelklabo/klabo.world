# Phase 5 – Post-Cutover Monitoring

Date: 2025-11-15

## Summary
- Window: 05:44–06:14 UTC (30 minutes immediately after DNS verification).
- Signals observed in Azure Portal → Application Insights for `klabo-world-app`:
  - **Requests** steady between 2–6 RPS (driven by smoke + real traffic).
  - **Server exceptions** stayed at 0.
  - **Availability** 100% (no failed dependency calls or HTTP 5xx spikes).
- Supplemental check: `az webapp log tail --name klabo-world-app --resource-group klabo-world-rg` (captured at 05:50 UTC) showed clean Next.js startup logs and no Prisma/runtime errors aside from the known OpenSSL warning (tracked separately).

## Notes
- The Prisma OpenSSL warning observed at boot is addressed as of 2025-12-01 by installing OpenSSL 3.0 libs in the Docker image (see Dockerfile base stage).
- With Application Insights quiet and smoke/k6 runs succeeding, the site is considered stable enough to decommission the legacy Vapor deployment.
