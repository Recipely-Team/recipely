import { timerStore } from '@application/timers/timer-store';
import { alarmStore } from '@application/timers/alarm-store';
import { conflictingTimerIds } from '@application/timers/conflicting-timer-ids';
import { getNotificationService } from '@application/notifications/get-notification-service';
import { triggeredAlarms } from '@presentation/base/timers/triggered-alarms';
import { TimerTimeConstants } from '@presentation/base/timers/timer-time-constants';
import { showWarningToast } from '@presentation/base/feedback/show-toast';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/**
 * True when this recipe already has a timer going, which makes starting a
 * second one a no-op with a warning (see {@link conflictingTimerIds}).
 *
 * The running countdown is never stopped on the user's behalf: an accidental
 * tap on "cook" would then throw away a bake that has been on the clock for
 * half an hour, and nothing about that tap says the user meant it. Stopping is
 * an explicit act, so the refusal explains what to do instead.
 */
const isBlockedByRunningTimer = (recipeId: string, startingTimerId: string): boolean => {
  const blocking = conflictingTimerIds(timerStore.getState().timers, recipeId, startingTimerId);
  if (blocking.length === ValueConstants.zero) return false;

  showWarningToast(t().timer.alreadyRunning);
  return true;
};

/** Starts a timer: schedules all alarm notifications and persists the entry. */
export const startTimer = async (
  timerId: string,
  recipeId: string,
  recipeName: string,
  minutes: number,
): Promise<void> => {
  if (minutes <= ValueConstants.zero) return;
  if (isBlockedByRunningTimer(recipeId, timerId)) return;
  // Timer ids are deterministic (`<recipeId>:<slot>`), so a re-start must clear
  // the "already alarmed" mark or this run would expire silently.
  triggeredAlarms.release(timerId);
  // Restarting the SAME timer would otherwise leave the previous run's
  // notifications scheduled — `add()` overwrites the entry that held their ids.
  if (timerStore.getState().timers[timerId] !== undefined) await stopTimer(timerId);
  await getNotificationService().requestPermissions();
  const durationSeconds = Math.round(minutes * TimerTimeConstants.secondsPerMinute);
  const endTimeMs = Date.now() + durationSeconds * TimerTimeConstants.msPerSecond;
  const completionNotifIds = await getNotificationService().scheduleTimerComplete(
    timerId,
    recipeName,
    endTimeMs,
    t().timer.notificationBody,
  );
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
  // A stopped timer must not stay in the alarm queue: whether it was stopped
  // from its chip, from the notification's "dismiss" action or by the overlay
  // itself, there is nothing left for that alarm to be about.
  alarmStore.getState().dismiss(timerId);
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
  // Resuming is a start as far as the one-timer-per-recipe rule is concerned:
  // the other phase may well have been started while this one sat paused.
  if (isBlockedByRunningTimer(entry.recipeId, timerId)) return;
  // Same reason as `startTimer`: this run gets a new end time, so the mark from
  // an earlier expiry must not silence it.
  triggeredAlarms.release(timerId);
  const newEndTimeMs = Date.now() + entry.remainingMsOnPause;
  const completionNotifIds = await getNotificationService().scheduleTimerComplete(
    timerId,
    entry.recipeName,
    newEndTimeMs,
    t().timer.notificationBody,
  );
  timerStore.setState((s) => {
    const cur = s.timers[timerId];
    if (cur === undefined) return s;
    return { timers: { ...s.timers, [timerId]: { ...cur, completionNotifIds } } };
  });
  await timerStore.getState().resume(timerId, newEndTimeMs);
};
