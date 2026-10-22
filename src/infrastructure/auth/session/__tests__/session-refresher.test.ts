import { ok } from '@core/result/result-helpers';
import { SessionRefresher } from '@infrastructure/auth/session/session-refresher';

// Refresh tokens are single-use: if three requests that all got a 401 each
// refreshed, the second and third would present a revoked token and the server
// would revoke the sign-in as stolen.
describe('SessionRefresher', () => {
  it('runs one refresh for any number of requests that hit a 401 together', async () => {
    let finish: () => void = () => undefined;
    const refresh = jest.fn(() => new Promise<ReturnType<typeof ok<undefined>>>((resolve) => {
      finish = () => resolve(ok(undefined));
    }));
    const refresher = new SessionRefresher(refresh);

    const all = Promise.all([refresher.run(), refresher.run(), refresher.run()]);
    finish();

    expect(await all).toEqual([true, true, true]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('starts a new refresh once the previous one settled', async () => {
    const refresh = jest.fn(() => Promise.resolve(ok(undefined)));
    const refresher = new SessionRefresher(refresh);

    await refresher.run();
    await refresher.run();

    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
