/**
 * Unit conversions for time arithmetic.
 *
 * Named because `* 1000` reads as "a thousand of something" and the reader has
 * to infer which — a JWT `exp` is in seconds, `Date` takes milliseconds, and
 * getting that backwards produces a token that expires in 1970 or in the year
 * 55000. The name carries the unit the number converts between.
 */
export const TimeConstants = {
  millisecondsPerSecond: 1000,
  secondsPerMinute: 60,
  minutesPerHour: 60,
  hoursPerDay: 24,
  /** 24 h × 60 min × 60 s × 1000 ms. */
  millisecondsPerDay: 86_400_000,
} as const;
