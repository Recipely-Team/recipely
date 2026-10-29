import { NetworkFailure, RateLimitFailure, ServerFailure, TimeoutFailure, ValidationFailure } from '@core/failure';
import { readRetryDelayMs } from '@infrastructure/network/errors/read-retry-delay';

/**
 * A read the API never answered is asked again with backoff; the delays spread
 * phones that lost the API in the same deploy restart, and the retries stop
 * before the user waits on a dead connection for long.
 */
describe('readRetryDelayMs', () => {
  const lowest = () => 0;
  const highest = () => 1;

  it('waits half to all of a doubling ceiling: 400-800 ms, then 800-1600 ms', () => {
    const dropped = new NetworkFailure();

    expect([readRetryDelayMs(dropped, 0, lowest), readRetryDelayMs(dropped, 0, highest)]).toEqual([400, 800]);
    expect([readRetryDelayMs(dropped, 1, lowest), readRetryDelayMs(dropped, 1, highest)]).toEqual([800, 1600]);
  });

  it('gives a fast failure two retries and a timeout one', () => {
    expect(readRetryDelayMs(new ServerFailure('down', 503), 1)).not.toBeNull();
    expect(readRetryDelayMs(new ServerFailure('down', 503), 2)).toBeNull();
    expect(readRetryDelayMs(new TimeoutFailure(), 0)).not.toBeNull();
    expect(readRetryDelayMs(new TimeoutFailure(), 1)).toBeNull();
  });

  it('never retries what the API itself decided', () => {
    expect(readRetryDelayMs(new ServerFailure('bug', 500), 0)).toBeNull();
    expect(readRetryDelayMs(new RateLimitFailure('slow down'), 0)).toBeNull();
    expect(readRetryDelayMs(new ValidationFailure('bad'), 0)).toBeNull();
  });
});
