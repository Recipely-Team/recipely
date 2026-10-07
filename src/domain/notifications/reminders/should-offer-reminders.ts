import { TimeConstants } from '@core/constants';
import type { RemindersChoiceType } from '@domain/notifications/reminders/reminders-choice';

/** How long after the first open the question waits: it is asked on a return visit, never the first one. */
const OFFER_DELAY_MS = TimeConstants.millisecondsPerDay;

/**
 * True when the "may we remind you?" question should be asked now.
 *
 * @remarks
 * - **Once:** any stored answer, yes or no, ends it for good; the Settings switch is the way back.
 * - **On a return visit:** a first-time user is still deciding whether the app is worth keeping;
 *   someone who came back a day later has answered that, so the question lands better.
 */
export const shouldOfferReminders = (
  choice: RemindersChoiceType | null,
  firstOpenMs: number | null,
  nowMs: number,
): boolean => choice === null && firstOpenMs !== null && nowMs - firstOpenMs >= OFFER_DELAY_MS;
