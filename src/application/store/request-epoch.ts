import { ValueConstants } from '@core/constants';

/**
 * **Request epoch** — tells a store whether an answer still belongs to the
 * request that is current, so a late answer is dropped instead of written.
 *
 * @remarks
 * - **`start()` opens a request** and returns its `isCurrent` check; a later
 *   `start()` or an `invalidate()` makes every earlier check false.
 * - **`invalidate()` is the session guard**: a store's `clear()` on sign-out
 *   calls it, so nothing in flight writes the old account back.
 * - Replaces the hand-rolled `let session = 0; const requested = session;
 *   if (requested !== session) return` pattern.
 */
export class RequestEpoch {
  private epoch = ValueConstants.zero;

  start(): () => boolean {
    this.epoch += ValueConstants.one;
    const mine = this.epoch;
    return () => mine === this.epoch;
  }

  invalidate(): void {
    this.epoch += ValueConstants.one;
  }
}
