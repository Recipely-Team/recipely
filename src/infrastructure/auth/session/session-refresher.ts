import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';

/**
 * **Single-flight session refresh** — however many requests hit a 401 at
 * once, one refresh runs and they all wait on it.
 *
 * @remarks
 * - Refresh tokens are single-use: two refreshes racing with the same token
 *   would have the server treat the second as a stolen copy.
 */
export class SessionRefresher {
  private inFlight: Promise<boolean> | null = null;

  constructor(private readonly refresh: () => Promise<Result<unknown, Failure>>) {}

  run(): Promise<boolean> {
    this.inFlight ??= this.refresh()
      .then((result) => result.ok)
      .finally(() => {
        this.inFlight = null;
      });
    return this.inFlight;
  }
}
