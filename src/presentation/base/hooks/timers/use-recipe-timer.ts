import { useCallback } from 'react';
import { timerStore } from '@application/timers/timer-store';
import {
  startTimer,
  stopTimer,
  pauseTimer,
  resumeTimer,
} from '@presentation/base/timers/timer-controls';
import { remainingSecondsUntil, secondsFromMs } from '@presentation/base/timers/remaining-seconds';
import { TimerTimeConstants } from '@presentation/base/timers/timer-time-constants';
import { useTimerTick } from '@presentation/base/hooks/timers/use-timer-tick';
import type { UseRecipeTimerParams } from '@presentation/base/hooks/timers/use-recipe-timer-params';
import type { RecipeTimerState } from '@presentation/base/hooks/timers/recipe-timer-state';
import { ValueConstants } from '@core/constants';

/**
 * Drives a single persistent recipe timer: subscribes to the shared timer
 * store, reads the app-wide one-second clock, and exposes the start / stop /
 * pause / resume controls. The timer survives screen navigation and app
 * backgrounding because all state lives in `timerStore` (persisted to secure
 * storage), not local state.
 *
 * The countdown is DERIVED from `endTimeMs` and the shared tick rather than
 * held in local state behind a per-timer `setInterval`: several timers running
 * at once used to mean several independent intervals each committing its own
 * render every second (see `timer-tick.ts`).
 */
export const useRecipeTimer = ({
  timerId,
  recipeId,
  recipeName,
  minutes,
}: UseRecipeTimerParams): RecipeTimerState => {
  const entry = timerStore((s) => s.timers[timerId]);

  const isActive = entry !== undefined;
  const isPaused = entry?.isPaused ?? false;
  const endTimeMs = entry?.endTimeMs ?? ValueConstants.zero;
  const remainingMsOnPause = entry?.remainingMsOnPause ?? ValueConstants.zero;

  // Once the end time has passed the displayed value can never change again,
  // so a finished timer drops off the clock instead of re-rendering forever.
  const isRunning = isActive && !isPaused;
  const hasExpired = isRunning && endTimeMs <= Date.now();
  const nowMs = useTimerTick(isRunning && !hasExpired);

  const remainingSeconds = !isActive
    ? Math.round(minutes * TimerTimeConstants.secondsPerMinute)
    : isPaused
      ? secondsFromMs(remainingMsOnPause)
      : hasExpired
        ? ValueConstants.zero
        : remainingSecondsUntil(endTimeMs, nowMs);

  const start = useCallback(
    () => startTimer(timerId, recipeId, recipeName, minutes),
    [timerId, recipeId, recipeName, minutes],
  );
  const stop = useCallback(() => stopTimer(timerId), [timerId]);
  const pause = useCallback(() => pauseTimer(timerId), [timerId]);
  const resume = useCallback(() => resumeTimer(timerId), [timerId]);

  return {
    isActive,
    isPaused,
    isDone: isActive && remainingSeconds === ValueConstants.zero,
    remainingSeconds,
    start,
    stop,
    pause,
    resume,
  };
};
