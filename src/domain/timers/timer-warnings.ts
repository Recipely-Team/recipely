import { TimeConstants } from '@core/constants';
import type { TimerWarning } from '@domain/timers/timer-warning';

/** Minutes-left marks a heads-up can sit at, longest first. */
const WarningLeadMinutes = { early: 5, last: 1 } as const;
const WARNING_LEADS_MINUTES: readonly number[] = [WarningLeadMinutes.early, WarningLeadMinutes.last];

/** A heads-up only lands in the second half of the countdown. */
const MIN_RUN_PER_LEAD = 2;

const MS_PER_MINUTE = TimeConstants.secondsPerMinute * TimeConstants.millisecondsPerSecond;

/**
 * The "time is almost up" heads-ups a countdown ending at `endTimeMs` gets from `nowMs`.
 *
 * @remarks
 * - **Second half only:** a mark is kept when the time left is at least twice its lead. A
 *   10-minute timer gets 5 and 1, a 3-minute timer gets only 1, a 90-second timer gets none:
 *   "5 minutes left" one second after starting a 5-minute timer is noise, not a warning.
 * - **Resume re-asks:** a resumed timer calls this again with its new end, so the rule holds
 *   for what is left, not for the original duration.
 */
export const timerWarnings = (endTimeMs: number, nowMs: number): TimerWarning[] => {
  const remainingMs = endTimeMs - nowMs;
  return WARNING_LEADS_MINUTES.filter((lead) => remainingMs >= lead * MS_PER_MINUTE * MIN_RUN_PER_LEAD).map(
    (lead) => ({ fireAtMs: endTimeMs - lead * MS_PER_MINUTE, minutesLeft: lead }),
  );
};
