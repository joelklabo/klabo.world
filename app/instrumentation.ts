import { AzureMonitorTraceExporter } from '@azure/monitor-opentelemetry-exporter';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { env } from './src/lib/env';

const connectionString = env.APPLICATIONINSIGHTS_CONNECTION_STRING;

export async function register() {
  if (!connectionString) {
    return;
  }

  const sdk = new NodeSDK({
    traceExporter: new AzureMonitorTraceExporter({ connectionString }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  try {
    await sdk.start();
  } catch (err) {
    console.error('[otel] failed to start', err);
  }
}
