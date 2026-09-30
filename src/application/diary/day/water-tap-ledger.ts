import { ValueConstants } from '@core/constants';

/**
 * Per-date bookkeeping for optimistic water taps: the last count the server
 * confirmed, and which tap is the latest.
 *
 * @remarks
 * - **Roll back to the confirmed count, never to a snapshot.** A snapshot
 *   taken at tap time is itself optimistic when taps overlap: two failed taps
 *   from 2 → 3 → 4 used to settle on 3, a value the server never held.
 * - **Only the latest tap may move the display.** An earlier tap settling
 *   late (success or failure) records what it learned but leaves the screen to
 *   the newer tap.
 */
export class WaterTapLedger {
  private readonly confirmedByDate = new Map<string, number>();
  private readonly latestTapByDate = new Map<string, number>();
  /** Global, never reset per date, so a tap still in flight can never share a number with a newer one. */
  private lastTap = ValueConstants.zero;

  /** Registers a tap and returns its sequence number for `isLatest`. */
  begin(date: string): number {
    this.lastTap += ValueConstants.one;
    this.latestTapByDate.set(date, this.lastTap);
    return this.lastTap;
  }

  isLatest(date: string, tap: number): boolean {
    return this.latestTapByDate.get(date) === tap;
  }

  /** Whether the latest tap on `date` has not settled yet — a day reload must not undo it. */
  hasTaps(date: string): boolean {
    return this.latestTapByDate.has(date);
  }

  confirm(date: string, glasses: number): void {
    this.confirmedByDate.set(date, glasses);
  }

  /** Records the server's count unless a tap has claimed the date since. */
  confirmFromLoad(date: string, glasses: number): void {
    if (!this.hasTaps(date)) this.confirmedByDate.set(date, glasses);
  }

  confirmed(date: string): number | undefined {
    return this.confirmedByDate.get(date);
  }

  /** Forgets the tap sequence once the latest tap has settled. */
  settle(date: string, tap: number): void {
    if (this.isLatest(date, tap)) this.latestTapByDate.delete(date);
  }

  clear(): void {
    this.confirmedByDate.clear();
    this.latestTapByDate.clear();
  }
}
