import { timerStore } from '@application/timers/timer-store';
import { alarmStore } from '@application/timers/alarm-store';
import { conflictingTimerIds } from '@application/timers/conflicting-timer-ids';
import { getNotificationService } from '@application/notifications/get-notification-service';
import { triggeredAlarms } from '@presentation/base/timers/triggered-alarms';
import { TimerTimeConstants } from '@presentation/base/timers/timer-time-constants';
import { showWarningToast } from '@presentation/base/feedback/show-toast';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { timerWarnings } from '@domain/timers/timer-warnings';
import type { TimerWarningAlert } from '@domain/timers/timer-warning-alert';

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

/** "1 minute left" / "5 minutes left" in the user's language. */
const minutesLeftCopy = (minutes: number): string =>
  minutes === ValueConstants.one ? t().timer.oneMinuteLeft : t().timer.minutesLeft.replace('{n}', String(minutes));

/**
 * Schedules a countdown's alarm and its quiet heads-ups; the ids come back together so one
 * `cancel` on stop or pause clears both.
 */
const scheduleAlerts = async (timerId: string, recipeName: string, endTimeMs: number): Promise<string[]> => {
  const service = getNotificationService();
  const alerts = timerWarnings(endTimeMs, Date.now()).map(
    (w): TimerWarningAlert => ({ fireAtMs: w.fireAtMs, body: minutesLeftCopy(w.minutesLeft) }),
  );
  const [completion, warnings] = await Promise.all([
    service.scheduleTimerComplete(timerId, recipeName, endTimeMs, t().timer.notificationBody),
    service.scheduleTimerWarnings(timerId, recipeName, alerts),
  ]);
  return [...completion, ...warnings];
};

/** Starts a timer: schedules its alarm and heads-ups and persists the entry. */
export const startTimer = async (
  timerId: string,
  recipeId: string,
  recipeName: string,
  minutes: number,
): Promise<void> => {
  if (minutes <= ValueConstants.zero) return;
  if (isBlockedByRunningTimer(recipeId, timerId)) return;
  // Ids are deterministic, so clear the already-alarmed mark on restart.
  triggeredAlarms.release(timerId);
  // Stop the previous run first so its notifications are cancelled.
  if (timerStore.getState().timers[timerId] !== undefined) await stopTimer(timerId);
  await getNotificationService().requestPermissions();
  const durationSeconds = Math.round(minutes * TimerTimeConstants.secondsPerMinute);
  const endTimeMs = Date.now() + durationSeconds * TimerTimeConstants.msPerSecond;
  const completionNotifIds = await scheduleAlerts(timerId, recipeName, endTimeMs);
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
  // Resume counts as a start for the one-timer-per-recipe rule.
  if (isBlockedByRunningTimer(entry.recipeId, timerId)) return;
  triggeredAlarms.release(timerId);
  const newEndTimeMs = Date.now() + entry.remainingMsOnPause;
  const completionNotifIds = await scheduleAlerts(timerId, entry.recipeName, newEndTimeMs);
  timerStore.setState((s) => {
    const cur = s.timers[timerId];
    if (cur === undefined) return s;
    return { timers: { ...s.timers, [timerId]: { ...cur, completionNotifIds } } };
  });
  await timerStore.getState().resume(timerId, newEndTimeMs);
};
