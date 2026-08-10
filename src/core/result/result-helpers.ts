import type { Result } from '@core/result/result';

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const fail = <F>(failure: F): Result<never, F> => ({ ok: false, failure });

export const isOk = <T, F>(r: Result<T, F>): r is { ok: true; value: T } => r.ok;

export const isFail = <T, F>(r: Result<T, F>): r is { ok: false; failure: F } => !r.ok;

export const mapResult = <T, U, F>(r: Result<T, F>, f: (t: T) => U): Result<U, F> =>
  r.ok ? ok(f(r.value)) : r;

export const flatMapResult = <T, U, F>(
  r: Result<T, F>,
  f: (t: T) => Result<U, F>,
): Result<U, F> => (r.ok ? f(r.value) : r);
// helpers ile Result tek dosyada olabilir gereksiz ayırma