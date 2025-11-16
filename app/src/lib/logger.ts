import { SeverityLevel } from '@microsoft/applicationinsights-web';
import { trace } from '@opentelemetry/api';

// Server-side logging - for client-side, see ApplicationInsights.tsx component
let appInsights: unknown;
const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
if (connectionString && typeof window === 'undefined') {
  // For server-side, we rely on the instrumentation.ts setup via OpenTelemetry
  // This logger provides structured console fallback
}

type LogProperties = Record<string, unknown>;

function log(
  message: string,
  severity: SeverityLevel,
  properties?: LogProperties,
  error?: Error,
) {
  const currentSpan = trace.getActiveSpan();
  const traceId = currentSpan?.spanContext().traceId;
  const spanId = currentSpan?.spanContext().spanId;

  const mergedProperties = {
    ...properties,
    traceId,
    spanId,
  };

  if (appInsights) {
    if (error) {
      appInsights.defaultClient.trackException({
        exception: error,
        severityLevel: severity,
        properties: mergedProperties,
      });
    } else {
      appInsights.defaultClient.trackTrace({
        message,
        severityLevel: severity,
        properties: mergedProperties,
      });
    }
  } else {
    // Fallback to console logging if Application Insights is not initialized
    const logMessage = `[${SeverityLevel[severity]}] ${message}`;
    if (error) {
      console.error(logMessage, mergedProperties, error);
    } else {
      console.log(logMessage, mergedProperties);
    }
  }
}

export const logger = {
  info: (message: string, properties?: LogProperties) =>
    log(message, SeverityLevel.Information, properties),
  warn: (message: string, properties?: LogProperties) =>
    log(message, SeverityLevel.Warning, properties),
  error: (message: string, error?: Error, properties?: LogProperties) =>
    log(message, SeverityLevel.Error, properties, error),
  debug: (message: string, properties?: LogProperties) =>
    log(message, SeverityLevel.Verbose, properties),
};
