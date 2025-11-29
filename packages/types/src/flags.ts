export type FlagType = 'boolean' | 'string' | 'number' | 'json';

export type FlagValue = boolean | string | number | Record<string, unknown>;

export type FlagSource = 'redis' | 'env' | 'provider' | 'default';

export type KillSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface FlagDefinition {
  key: string;
  type: FlagType;
  defaultValue: FlagValue;
  description?: string;
  owner: string;
  expiry: string; // ISO date (YYYY-MM-DD)
  issue: string; // beads id or URL
  killSeverity: KillSeverity;
}

export interface FlagEvaluationContext {
  userId?: string;
  bucket?: string;
}

export interface FlagEvaluation {
  key: string;
  value: FlagValue;
  source: FlagSource;
  metadata: FlagDefinition;
  isKillSwitch: boolean;
}

export interface FlagAdapterResult {
  value: FlagValue;
  source: FlagSource;
}

export interface FlagAdapter {
  get(key: string, ctx?: FlagEvaluationContext): Promise<FlagAdapterResult | null>;
  getAll(prefix?: string): Promise<Record<string, FlagAdapterResult>>;
}
