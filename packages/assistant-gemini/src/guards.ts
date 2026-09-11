/** Narrowing helpers for frames this package did not produce. */
export const isString = (value: unknown): value is string => typeof value === 'string';

export const isNonEmptyString = (value: unknown): value is string => isString(value) && value.length > 0;
