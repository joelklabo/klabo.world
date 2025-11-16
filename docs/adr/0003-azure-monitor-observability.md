# ADR 0003: Azure Monitor and Application Insights for Observability

**Date**: 2025-11-16  
**Status**: Accepted  
**Deciders**: Engineering Team

## Context

The platform needs comprehensive observability covering server-side traces, client-side performance (RUM), structured logging, alerting, and dashboards. We needed a solution that integrates well with our Azure deployment and provides actionable insights.

## Decision

We adopted **Azure Monitor Application Insights** as our observability platform, using:
- **OpenTelemetry** for server-side instrumentation (`@opentelemetry/sdk-node`)
- **Application Insights JavaScript SDK** for client-side Real User Monitoring (RUM)
- **Azure Monitor alerts** for SLO-based notifications
- **Log Analytics** for KQL-powered dashboards

## Rationale

**Why Azure Monitor:**
- Native integration with Azure App Service (our deployment target)
- Single pane of glass for server + client + infrastructure metrics
- Powerful KQL query language for custom dashboards
- Automatic correlation of distributed traces
- Cost-effective for our scale (first 5GB/month free)
- Managed service - no infrastructure to maintain

**Why OpenTelemetry:**
- Vendor-neutral instrumentation (not locked to Application Insights)
- Automatic instrumentation of HTTP, database, external calls
- Industry standard backed by CNCF
- Easy to switch exporters if we move away from Azure

**Implementation:**
- Server: `app/instrumentation.ts` bootstraps OpenTelemetry with Azure Monitor exporter
- Client: `ApplicationInsights` component in root layout tracks page views, performance
- Logging: `app/src/lib/logger.ts` adds trace context to console logs (OpenTelemetry collects)
- Dashboards: KQL queries in `content/dashboards/*.mdx` with admin UI
- Alerting: `infra/modules/monitoring.bicep` defines SLO-based alerts

**Alternatives Considered:**
1. **Datadog** - More features but significantly more expensive; overkill for our needs
2. **Sentry** - Great for error tracking but weaker on APM/RUM
3. **Grafana Cloud** - Strong OSS solution but requires more setup; less Azure integration
4. **CloudWatch** - AWS-specific; not applicable for Azure deployment
5. **Self-hosted Prometheus + Grafana** - More control but requires infrastructure management

## Consequences

**Positive:**
- End-to-end visibility from browser to database
- Automatic trace correlation across services
- KQL provides flexible custom dashboards
- Alert emails when SLOs are breached
- No infrastructure to manage (fully managed)
- Easy integration with Azure DevOps if we adopt it

**Negative:**
- Vendor lock-in to Azure ecosystem (mitigated by OpenTelemetry abstraction)
- KQL has a learning curve compared to SQL
- Some features require Azure-specific SDKs (e.g., dependency tracking)
- Free tier limits may require monitoring as traffic grows

**Mitigations:**
- Use OpenTelemetry's vendor-neutral APIs; minimize Azure-specific code
- Document KQL patterns in dashboard MDX files
- Define clear SLOs (`docs/observability/slos.md`) to focus monitoring efforts
- Monitor Application Insights costs; alert if approaching paid tiers
- Environment variables are optional so local dev works without Azure account
