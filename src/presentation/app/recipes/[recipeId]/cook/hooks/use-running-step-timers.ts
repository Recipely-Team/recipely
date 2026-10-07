import { useMemo } from 'react';
import { timerStore } from '@application/timers/timer-store';
import { stepTimerId } from '@presentation/base/timers/step-timer-id';
import { stepDurationMinutes } from '@presentation/app/recipes/[recipeId]/cook/model/step-duration-minutes';
import type { StepTimerSlot } from '@presentation/app/recipes/[recipeId]/cook/model/step-timer-slot';

/**
 * The step timers of this recipe still counting for steps other than the one on
 * screen — "simmer 10 minutes" goes on while the cook reads on.
 *
 * Cook mode lists them inline; the app-wide timers bar leaves them out while
 * this recipe is being cooked, so it never covers the Next button with a
 * countdown the screen already shows.
 */
export const useRunningStepTimers = (
  recipeId: string,
  steps: readonly string[],
  currentIndex: number,
): readonly StepTimerSlot[] => {
  const timers = timerStore((s) => s.timers);

  return useMemo(
    () =>
      steps.flatMap((step, index) => {
        const minutes = index === currentIndex ? null : stepDurationMinutes(step);
        return minutes !== null && timers[stepTimerId(recipeId, index, minutes)] !== undefined ? [{ index, minutes }] : [];
      }),
    [timers, steps, currentIndex, recipeId],
  );
};
