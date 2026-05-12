import { z } from 'zod';

export type ActionState = {
  message: string;
  errors?: Record<string, string[]>;
  success?: boolean;
};

type ParsedSuccess<T> = {
  ok: true;
  data: T;
};

type ParsedFailure = {
  ok: false;
  state: ActionState;
};

type ParsedResult<T> = ParsedSuccess<T> | ParsedFailure;

type FormValues = Record<string, unknown>;

function failFromSchema(error: z.ZodError): ActionState {
  return {
    message: 'Validation failed',
    errors: error.flatten().fieldErrors,
    success: false,
  };
}

export function parseFormData<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  formData: FormData,
): ParsedResult<z.output<TSchema>> {
  return parseFormValues(schema, Object.fromEntries(formData.entries()));
}

export function parseFormValues<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  values: FormValues,
): ParsedResult<z.output<TSchema>> {
  const result = schema.safeParse(values);
  if (!result.success) {
    return { ok: false, state: failFromSchema(result.error) };
  }
  return { ok: true, data: result.data as z.output<TSchema> };
}
