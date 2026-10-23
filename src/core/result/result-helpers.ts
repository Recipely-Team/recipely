import type { Result } from '@core/result/result';

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const fail = <F>(failure: F): Result<never, F> => ({ ok: false, failure });

export const mapResult = <T, U, F>(r: Result<T, F>, f: (t: T) => U): Result<U, F> =>
  r.ok ? ok(f(r.value)) : r;

export const flatMapResult = <T, U, F>(
  r: Result<T, F>,
  f: (t: T) => Result<U, F>,
): Result<U, F> => (r.ok ? f(r.value) : r);
// These helpers could live in result.ts — splitting them out bought nothing.
