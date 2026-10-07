import { RequestEpoch } from '@application/store/request-epoch';

describe('RequestEpoch', () => {
  it('keeps only the newest request current', () => {
    const epoch = new RequestEpoch();
    const first = epoch.start();
    const second = epoch.start();

    expect(first()).toBe(false);
    expect(second()).toBe(true);
  });

  it('invalidate makes the request in flight stale (sign-out)', () => {
    const epoch = new RequestEpoch();
    const inFlight = epoch.start();
    epoch.invalidate();

    expect(inFlight()).toBe(false);
  });
});
