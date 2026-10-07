import { ValueConstants } from '@core/constants';

/**
 * The timer-store id of one step's countdown, `${recipeId}:step3:10min`.
 *
 * The cook-mode button and the assistant's `startTimer` both build it here, so
 * the two start one timer, never two.
 */
export const cookStepTimerId = (recipeId: string, stepIndex: number, minutes: number): string =>
  `${recipeId}:step${String(stepIndex + ValueConstants.one)}:${String(minutes)}min`;
