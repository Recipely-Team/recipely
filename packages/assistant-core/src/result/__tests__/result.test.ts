import { fail, ok } from '../result';

describe('Result', () => {
  it('carries a value or a failure, never both', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(fail('socket_failed')).toEqual({ ok: false, failure: 'socket_failed' });
  });
});
