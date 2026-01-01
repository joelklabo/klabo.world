# Upload Threat Model

This threat model covers the admin upload pipeline used to attach images/media to posts, apps, and dashboards. It focuses on the Next.js admin interface, backend upload handlers, storage (local or Azure Blob), and public delivery via SAS/CDN.

## Scope
- Admin UI upload helper (authenticated session).
- Upload API/server action handling file validation and storage.
- Storage account/container configuration (local disk or Azure Blob).
- Public consumption of stored assets (SAS/CDN or private link).

## Assets to protect
- Admin credentials and session tokens.
- Uploaded files and metadata (PII, proprietary images).
- Storage account keys and SAS tokens.
- Content repository integrity (GitHub content sync).
- Service availability (rate limits, queue/backlog, storage limits).

## Trust boundaries
- Browser -> Next.js backend (session cookie + CSRF).
- Backend -> storage account (key/SAS access).
- Backend -> GitHub API (content sync).
- CDN/public users -> storage (cached assets).

## Data flow (high level)
1. Admin user uploads a file in `/admin`.
2. Backend validates file size/type/signature and writes to storage.
3. Backend returns an asset URL (local path or blob URL/SAS).
4. Public pages reference the asset URL.

## STRIDE analysis

| Category | Threat | Impact | Mitigations |
| --- | --- | --- | --- |
| Spoofing | Unauthenticated upload requests | Unauthorized content injection | Require authenticated admin session, CSRF protection, enforce server-side auth checks. |
| Tampering | Uploading malicious files (polyglots, malware) | XSS, downstream compromise | Strict file signature checks, MIME allowlist, AV scanning, quarantine on upload. |
| Repudiation | Admin denies upload activity | Poor auditability | Audit logs with user ID, IP, timestamp, and file hash. |
| Information disclosure | Public blob exposure or leaked SAS tokens | Data leakage | Storage `allowBlobPublicAccess=false`, private containers, short-lived SAS, Key Vault for secrets. |
| Denial of service | Upload floods / large files | Service degradation | Rate limiting, max size limits, request timeouts, backpressure. |
| Elevation of privilege | Malicious file processed as code | Server compromise | Store outside executable paths, disable SVG, sanitize metadata, serve with safe headers. |

## Abuse cases to address
- Polyglot files passing MIME sniffing.
- Massive or repeated uploads from a single IP.
- Compromised admin session uploading malware.
- Hotlinking public URLs to drive bandwidth costs.
- Reuse of leaked SAS tokens beyond intended scope.

## Mitigations (current + planned)
- Authenticated admin sessions for uploads.
- File size limits and MIME allowlist (JPEG/PNG/GIF/WebP).
- File signature (magic byte) validation.
- Rate limiting with Redis-backed enforcement.
- Private containers with SAS/CDN access only.
- Quarantine container + AV scan results before promotion.
- Audit logging for uploads and bypass events.

## Monitoring and alerts
- Track upload success/failure counts and rate limit events.
- Alert on repeated scan failures or scan service outages.
- Monitor storage account public access setting and container policies.

## Open questions
- Final scan provider: Defender for Storage vs ClamAV.
- Quarantine retention period (default 30 days proposed).
- Emergency override policy and required approvals.
