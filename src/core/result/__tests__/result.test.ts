import { fail, flatMapResult, mapResult, ok } from '@core/result/result-helpers';

describe('Result', () => {
  it('wraps a value in ok', () => {
    const r = ok(42);

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(42);
  });

  it('wraps a failure in fail', () => {
    const r = fail('boom');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe('boom');
  });

  it('maps over ok but leaves fail untouched', () => {
    const mappedOk = mapResult(ok(3), (n) => n * 2);
    const mappedFail = mapResult<number, number, string>(fail('x'), (n) => n * 2);

    expect(mappedOk).toEqual({ ok: true, value: 6 });
    expect(mappedFail).toEqual({ ok: false, failure: 'x' });
  });

  it('flatMaps ok→ok, ok→fail, and short-circuits on fail', () => {
    const okOk = flatMapResult(ok(3), (n) => ok(n + 1));
    const okFail = flatMapResult(ok(3), () => fail('downstream'));
    const failShort = flatMapResult<number, number, string>(fail('upstream'), () => ok(99));

    expect(okOk).toEqual({ ok: true, value: 4 });
    expect(okFail).toEqual({ ok: false, failure: 'downstream' });
    expect(failShort).toEqual({ ok: false, failure: 'upstream' });
  });
});
