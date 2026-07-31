import { ValueConstants } from '@core/constants';
import { ClockFormat } from '@presentation/base/utils/clock-format';

export const SECOND_MS = 1000;
const SECONDS_PER_MINUTE = 60;

/** Whole seconds until `iso`, floored at 0. Empty/invalid → 0. */
export const computeRemaining = (iso: string): number => {
  if (iso.length === ValueConstants.zero) return ValueConstants.zero;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return ValueConstants.zero;
  return Math.max(ValueConstants.zero, Math.round((ms - Date.now()) / SECOND_MS));
};

/** Formats a second count as `M:SS`. */
export const formatCountdown = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${seconds.toString().padStart(ClockFormat.digits, ClockFormat.pad)}`;
};
