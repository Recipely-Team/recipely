import { BaseValueObject } from '@core/value-object/base-value-object';
import { TimeConstants } from '@core/constants';

const SNOOZE_DAYS = 3;

/** How long "Not now" keeps the optional update prompt away: long enough not to nag, short enough to come back. */
export const UPDATE_SNOOZE_MS =
  SNOOZE_DAYS * TimeConstants.hoursPerDay * TimeConstants.minutesPerHour * TimeConstants.secondsPerMinute * TimeConstants.millisecondsPerSecond;

/**
 * "Not now" on the optional update prompt: the moment it may show again.
 *
 * @remarks
 * - **Time, not release.** The prompt stays away for {@link UPDATE_SNOOZE_MS}
 *   whatever version is out, then asks once more while the update is still
 *   available. A required update ignores it — nothing opts out of the gate.
 * - **Stored as its epoch milliseconds**; anything unreadable (an older
 *   format, a corrupted value) is no snooze, so the worst case is one prompt.
 */
export class UpdateSnooze extends BaseValueObject<number> {
  private constructor(until: number) {
    super(until);
  }

  static startingAt(nowMs: number): UpdateSnooze {
    return new UpdateSnooze(nowMs + UPDATE_SNOOZE_MS);
  }

  static parse(raw: string | null): UpdateSnooze | null {
    if (raw === null || !/^\d+$/.test(raw)) return null;
    return new UpdateSnooze(Number(raw));
  }

  isActiveAt(nowMs: number): boolean {
    return nowMs < this._value;
  }

  serialize(): string {
    return String(this._value);
  }
}
