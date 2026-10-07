import { ValueConstants } from '@core/constants';
import { stepTimerPrefix } from '@presentation/base/timers/step-timer-prefix';

/**
 * The timer-store id of one instruction step's countdown, `${recipeId}:step3:10min`.
 *
 * Cook mode's button and the assistant's `startTimer` both build it here, so
 * the two start one timer, never two.
 */
export const stepTimerId = (recipeId: string, stepIndex: number, minutes: number): string =>
  `${stepTimerPrefix(recipeId)}${String(stepIndex + ValueConstants.one)}:${String(minutes)}min`;
