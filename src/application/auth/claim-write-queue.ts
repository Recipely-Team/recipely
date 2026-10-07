import { ValueConstants } from '@core/constants';

/**
 * **Claim-write queue** — orders the creator-claim calls of one session store.
 *
 * @remarks
 * - **Writes run one at a time, in the order asked for**: two platforms written
 *   together would otherwise each answer with a session built before the other's
 *   write, and the later answer would drop one. A failed write does not stall
 *   the ones queued behind it.
 * - **A write counts as in flight from the moment it is queued** until it
 *   settles, so a refresh started meanwhile knows it was overtaken.
 * - **A refresh is current** only when no write was in flight as it started and
 *   none started while it ran: otherwise it read the claim from before a change.
 */
export class ClaimWriteQueue {
  private writes = ValueConstants.zero;
  private inFlight = ValueConstants.zero;
  private tail: Promise<void> = Promise.resolve();

  write<T>(call: () => Promise<T>): Promise<T> {
    this.writes += ValueConstants.one;
    this.inFlight += ValueConstants.one;
    const run = this.tail.then(call).finally(() => {
      this.inFlight -= ValueConstants.one;
    });
    this.tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  refresh<T>(call: (isCurrent: () => boolean) => Promise<T>): Promise<T> {
    const startedAfter = this.writes;
    const startedIdle = this.inFlight === ValueConstants.zero;
    return call(() => startedIdle && this.writes === startedAfter);
  }
}
