import { SeverityLevel } from '@microsoft/applicationinsights-web';
import { trace } from '@opentelemetry/api';

// Server-side structured logger with OpenTelemetry trace correlation
// For client-side RUM, see ApplicationInsights.tsx component
// For server-side telemetry, see instrumentation.ts OpenTelemetry setup

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

  // Log to console with trace context - OpenTelemetry instrumentation
  // will collect and send to Application Insights automatically
  const logMessage = `[${SeverityLevel[severity]}] ${message}`;
  if (error) {
    console.error(logMessage, mergedProperties, error);
  } else {
    console.log(logMessage, mergedProperties);
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
