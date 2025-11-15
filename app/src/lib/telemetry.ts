import { SpanStatusCode, trace } from '@opentelemetry/api';

const tracer = trace.getTracer('klaboworld');
type ActiveSpan = ReturnType<typeof tracer.startSpan>;
type SpanCallback<T> = (span: ActiveSpan) => Promise<T> | T;
type SpanAttributesInput = Record<string, string | number | boolean>;

export async function withSpan<T>(name: string, callback: SpanCallback<T>, attributes?: SpanAttributesInput): Promise<T> {
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
