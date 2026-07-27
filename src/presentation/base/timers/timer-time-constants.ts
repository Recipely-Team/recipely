/**
 * Time conversions the timer module counts in.
 *
 * Structural values, not design measurements: they describe how a duration is
 * expressed, so they stay beside the timer helpers that share them rather than
 * being re-declared as bare `1000`s in every countdown.
 */
export const TimerTimeConstants = {
  msPerSecond: 1000,
  secondsPerMinute: 60,
  /** How often the shared countdown clock wakes up — see `timer-tick.ts`. */
  tickIntervalMs: 1000,
} as const;
