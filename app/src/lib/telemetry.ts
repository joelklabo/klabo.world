import { SpanStatusCode, metrics, trace } from '@opentelemetry/api';

const tracer = trace.getTracer('klaboworld');
const meter = metrics.getMeter('klaboworld');
const counterCache = new Map<string, ReturnType<typeof meter.createCounter>>();
type ActiveSpan = ReturnType<typeof tracer.startSpan>;
type SpanCallback<T> = (span: ActiveSpan) => Promise<T> | T;
type TelemetryAttributes = Record<string, string | number | boolean>;

export async function withSpan<T>(
  name: string,
  callback: SpanCallback<T>,
  attributes?: TelemetryAttributes,
): Promise<T> {
  const span = tracer.startSpan(name);
  if (attributes) {
    span.setAttributes(attributes as Parameters<typeof span.setAttributes>[0]);
  }
  try {
    const result = await callback(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
    throw error;
  } finally {
    span.end();
  }
}

export function incrementCounter(name: string, value = 1, attributes?: TelemetryAttributes) {
  let counter = counterCache.get(name);
  if (!counter) {
    counter = meter.createCounter(name);
    counterCache.set(name, counter);
  }
  counter.add(value, attributes as Parameters<typeof counter.add>[1]);
}
