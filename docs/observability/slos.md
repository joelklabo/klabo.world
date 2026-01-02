# Service Level Objectives (SLOs)

This document defines the Service Level Objectives (SLOs) for klabo.world. These SLOs are used to measure and reason about the reliability of the service.

## Key User Journeys

We have identified the following key user journeys:

1.  **Viewing a blog post:** A user should be able to load and view a blog post quickly and reliably.
2.  **Searching for content:** A user should be able to search for content and get relevant results in a timely manner.
3.  **Admin content management:** An administrator should be able to create, update, and delete content through the admin interface.

## SLOs

| User Journey | Metric | Target |
| --- | --- | --- |
| **Viewing a blog post** | 95th percentile of page load time | < 500ms |
| | Availability of the post page | 99.9% |
| **Searching for content** | 95th percentile of search API response time | < 300ms |
| | Availability of the search API | 99.9% |
| **Admin content management** | 95th percentile of admin form submission response time | < 1000ms |
| | Availability of the admin interface | 99.5% |
| **Health checks** | Availability of `/api/health` | 99.9% |
| **Upload pipeline** | Successful upload request rate (5xx) | 99.0% |

## Rate limiter telemetry

| Metric | Description | Suggested alert |
| --- | --- | --- |
| `rate_limit_decision_total{status,scope}` | Counter for rate limit outcomes (`allowed`, `blocked`, `bypassed`, `error`). | Alert if `status="error"` > 0 in 5m or `status="blocked"` spikes above expected baselines per scope. |
| `rate_limit_fallback_total{scope,mode,context}` | Counter for Redis fallback activation (memory fallback engaged). | Alert if > 0 in 5m; investigate Redis connectivity or config flaps. |

## Measurement

- **Page Load Time:** Measured using Application Insights frontend performance monitoring.
- **API Response Time:** Measured using Application Insights backend performance monitoring.
- **Availability:** Measured using Application Insights availability tests and by tracking the rate of failed requests.
