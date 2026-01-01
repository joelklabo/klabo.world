# ADR 0010: Upload Anti-Malware Policy

## Status
Proposed — targets beads issue `klabw-9dk.10`.

## Context
- Admin uploads are used for post images, app icons, and screenshots.
- Current validation checks file size and MIME type, but does not scan for malware.
- Storage public access is being disabled at the account level, requiring a private access strategy (SAS/CDN).
- We need a consistent policy for scan outcomes, quarantine retention, and manual overrides.

## Decision
Adopt a quarantine-first upload policy with AV scanning before promotion:
- Uploads land in a **private quarantine container**.
- Files remain in **processing** until scanned.
- Only **clean** assets are promoted to the public assets container (or exposed via SAS/CDN).
- In production, **fail-closed**: if scanning fails or times out, assets remain quarantined.
- In local development, **fail-open with warnings** to avoid blocking iteration.

## Status taxonomy
- `processing`: uploaded, awaiting scan.
- `clean`: scan passed; eligible for promotion.
- `quarantined`: scan failed or malicious detected.
- `scan_failed`: scanner unavailable or timeout (production keeps quarantined).

## Manual review flow
- Admins can manually review quarantined assets in the admin UI.
- Manual promotion requires an elevated role and an audit log entry.
- Manual overrides expire after a defined window (default 24 hours).

## Retention policy
- Quarantine retention: 30 days (configurable).
- Auto-purge quarantined items after retention window.

## Options considered
1. **Fail-open everywhere**: fastest uploads, but risk of serving malware.
2. **Fail-closed everywhere**: strongest security, but blocks local/dev workflows.
3. **Hybrid (chosen)**: fail-closed in production, fail-open in local/dev.

## Consequences
- Requires scan provider integration (Defender for Storage or ClamAV service).
- Adds latency between upload and public availability; UI must surface processing state.
- Requires audit logging and runbook for overrides.

## Follow-ups
- Implement quarantine container + scan metadata.
- Update runbooks with scan status troubleshooting and override flow.
- Decide scan provider and costs.
