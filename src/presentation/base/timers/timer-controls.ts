import { timerStore } from '@application/timers/timer-store';
import { conflictingTimerIds } from '@application/timers/conflicting-timer-ids';
import { getNotificationService } from '@application/notifications/get-notification-service';
import { triggeredAlarms } from '@presentation/base/timers/triggered-alarms';
import { TimerTimeConstants } from '@presentation/base/timers/timer-time-constants';
import { showNeutralToast } from '@presentation/base/feedback/show-toast';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/**
 * Stops whatever else this recipe had running, so only one of its phases counts
 * down at a time (see {@link conflictingTimerIds}). The switch is silent apart
 * from a toast: reaching for "cook" while "prep" runs says the prep is over,
 * and asking for confirmation every time would tax the common case.
 */
const replaceRecipeTimers = async (recipeId: string, startingTimerId: string): Promise<void> => {
  const replaced = conflictingTimerIds(timerStore.getState().timers, recipeId, startingTimerId);
  if (replaced.length === ValueConstants.zero) return;

  for (const id of replaced) {
    await stopTimer(id);
  }
  showNeutralToast(t().timer.switched);
};

/** Starts a timer: schedules all alarm notifications and persists the entry. */
export const startTimer = async (
  timerId: string,
  recipeId: string,
  recipeName: string,
  minutes: number,
): Promise<void> => {
  if (minutes <= ValueConstants.zero) return;
  // Timer ids are deterministic (`<recipeId>:<slot>`), so a re-start must clear
  // the "already alarmed" mark or this run would expire silently.
  triggeredAlarms.release(timerId);
  await replaceRecipeTimers(recipeId, timerId);
  await getNotificationService().requestPermissions();
  const durationSeconds = Math.round(minutes * TimerTimeConstants.secondsPerMinute);
  const endTimeMs = Date.now() + durationSeconds * TimerTimeConstants.msPerSecond;
  const completionNotifIds = await getNotificationService().scheduleTimerComplete(timerId, recipeName, endTimeMs);
  await timerStore.getState().add({
    id: timerId,
    recipeId,
    recipeName,
    durationSeconds,
    endTimeMs,
    isPaused: false,
    remainingMsOnPause: ValueConstants.zero,
    completionNotifIds,
  });
};

/** Stops and removes a timer, cancelling all of its alarm notifications. */
export const stopTimer = async (timerId: string): Promise<void> => {
  triggeredAlarms.release(timerId);
  const entry = timerStore.getState().timers[timerId];
  if (entry !== undefined) {
    await getNotificationService().cancel(entry.completionNotifIds);
  }
  await timerStore.getState().remove(timerId);
};

/** Pauses a running timer, cancelling scheduled notifications until resumed. */
export const pauseTimer = async (timerId: string): Promise<void> => {
  const entry = timerStore.getState().timers[timerId];
  if (entry === undefined || entry.isPaused) return;
  await getNotificationService().cancel(entry.completionNotifIds);
  await timerStore.getState().pause(timerId);
};

/** Resumes a paused timer, re-scheduling all alarm notifications. */
export const resumeTimer = async (timerId: string): Promise<void> => {
  const entry = timerStore.getState().timers[timerId];
  if (entry === undefined || !entry.isPaused) return;
  // Same reason as `startTimer`: this run gets a new end time, so the mark from
  // an earlier expiry must not silence it.
  triggeredAlarms.release(timerId);
  // Resuming is a start as far as the one-timer-per-recipe rule is concerned:
  // the other phase may well have been started while this one sat paused.
  await replaceRecipeTimers(entry.recipeId, timerId);
  const newEndTimeMs = Date.now() + entry.remainingMsOnPause;
  const completionNotifIds = await getNotificationService().scheduleTimerComplete(timerId, entry.recipeName, newEndTimeMs);
  timerStore.setState((s) => {
    const cur = s.timers[timerId];
    if (cur === undefined) return s;
    return { timers: { ...s.timers, [timerId]: { ...cur, completionNotifIds } } };
  });
  await timerStore.getState().resume(timerId, newEndTimeMs);
};
