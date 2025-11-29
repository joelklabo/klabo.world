import { z } from 'zod';
import { type FlagDefinition } from '@klaboworld/types';
import registryData from './registry.json';

const flagSchema = z.object({
  key: z.string().min(1),
  type: z.enum(['boolean', 'string', 'number', 'json']),
  defaultValue: z.union([z.boolean(), z.string(), z.number(), z.record(z.string(), z.any())]),
  description: z.string().optional(),
  owner: z.string().min(1),
  expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  issue: z.string().min(1),
  killSeverity: z.enum(['none', 'low', 'medium', 'high', 'critical']),
});

const registrySchema = z.array(flagSchema);

const parsed = registrySchema.parse(registryData);

function ensureUniqueKeys(definitions: FlagDefinition[]) {
  const seen = new Set<string>();
  for (const def of definitions) {
    if (seen.has(def.key)) {
      throw new Error(`Duplicate flag key detected: ${def.key}`);
    }
    seen.add(def.key);
  }
}

function ensureValidDates(definitions: FlagDefinition[]) {
  for (const def of definitions) {
    const date = new Date(def.expiry);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid expiry date for flag ${def.key}: ${def.expiry}`);
    }
  }
}

export const flagRegistry: FlagDefinition[] = parsed;

export function validateRegistry() {
  ensureUniqueKeys(flagRegistry);
  ensureValidDates(flagRegistry);
  return flagRegistry;
}
