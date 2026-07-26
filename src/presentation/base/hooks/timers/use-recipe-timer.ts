import { useCallback, useEffect, useRef, useState } from 'react';
import { timerStore } from '@application/timers/timer-store';
import {
  startTimer,
  stopTimer,
  pauseTimer,
  resumeTimer,
} from '@presentation/base/timers/timer-controls';
import type { UseRecipeTimerParams } from '@presentation/base/hooks/timers/use-recipe-timer-params';
import type { RecipeTimerState } from '@presentation/base/hooks/timers/recipe-timer-state';
import { ValueConstants } from '@core/constants';

const remainingFromEnd = (endTimeMs: number): number =>
  Math.max(ValueConstants.zero, Math.round((endTimeMs - Date.now()) / 1000));

/**
 * Drives a single persistent recipe timer: subscribes to the shared timer
 * store, ticks once a second, and schedules / cancels system notifications.
 * The timer survives screen navigation and app backgrounding because all
 * state lives in `timerStore` (persisted to secure storage), not local state.
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

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (!isActive) return minutes * 60;
    if (isPaused) return Math.round(remainingMsOnPause / 1000);
    return remainingFromEnd(endTimeMs);
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      setRemainingSeconds(minutes * 60);
      clearTick();
      return;
    }
    if (isPaused) {
      setRemainingSeconds(Math.round(remainingMsOnPause / 1000));
      clearTick();
      return;
    }
    // The shared notification syncer owns the system notification lifecycle;
    // this tick only drives the in-app countdown display.
    const tick = (): void => {
      const r = remainingFromEnd(endTimeMs);
      setRemainingSeconds(r);
      if (r === ValueConstants.zero) clearTick();
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return clearTick;
  }, [isActive, isPaused, endTimeMs, minutes, remainingMsOnPause, clearTick]);

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
