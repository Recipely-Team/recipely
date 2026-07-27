import { ValueConstants } from '@core/constants';
import { TimerTimeConstants } from '@presentation/base/timers/timer-time-constants';

/** Whole seconds left until `endTimeMs`, never negative. */
export const remainingSecondsUntil = (endTimeMs: number, nowMs: number): number =>
  Math.max(
    ValueConstants.zero,
    Math.round((endTimeMs - nowMs) / TimerTimeConstants.msPerSecond),
  );

/** Whole seconds in a millisecond span, never negative. */
export const secondsFromMs = (ms: number): number =>
  Math.max(ValueConstants.zero, Math.round(ms / TimerTimeConstants.msPerSecond));
