import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';

/** A wire string → one value of a vocabulary const, or a validation failure naming the field. */
export const readOneOf = <T extends string>(vocabulary: Readonly<Record<string, T>>, raw: string, field: string): Result<T, ValidationFailure> => {
  const value = Object.values(vocabulary).find((v) => v === raw);
  return value === undefined ? fail(new ValidationFailure(DiagnosticMessage.instagram.sourceInvalid(field, raw), field)) : ok(value);
};
