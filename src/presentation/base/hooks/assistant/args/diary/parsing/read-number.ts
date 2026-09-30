import { isString } from '@core/guards/type-guards';

/** A field the model sent as a number or a numeric string; `undefined` when absent, `NaN` when unreadable. */
export const readNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value;
  if (isString(value)) return Number(value.trim());
  return Number.NaN;
};
