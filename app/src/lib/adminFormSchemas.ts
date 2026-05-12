import { z } from 'zod';

import { splitTrimmedList } from './formTransforms';

export function requiredTextField(label: string) {
  return z.string().min(1, `${label} is required`);
}

export function parseListField(separator: string | RegExp) {
  return z.string().transform((value) => splitTrimmedList(value, separator));
}

export const parseNewlineList = parseListField(/\r?\n/);

export function optionalUrlField(errorMessage = 'Invalid URL') {
  return z
    .union([z.string().url(errorMessage), z.literal(''), z.undefined()])
    .transform((value) => (typeof value === 'string' && value.length > 0 ? value : undefined));
}
