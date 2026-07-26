import { useEffect } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { timerStore } from '@application/timers/timer-store';
import { alarmStore } from '@application/timers/alarm-store';
import {
  TIMER_COMPLETE,
  DISMISS_ALARM_ACTION,
} from '@domain/notifications/timer-notification-keys';
import { stopTimer } from '@presentation/base/timers/timer-controls';
import type * as NotificationsType from 'expo-notifications';
import { CharConstants, ValueConstants } from '@core/constants';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications = require('expo-notifications') as typeof NotificationsType;

const TICK_MS = 1000;

// Module-level set: tracks timers whose alarm has already been triggered this
// session so the 1-second tick does not re-fire it on each subsequent call.
const triggeredAlarms = new Set<string>();

const checkForCompletedTimers = (): void => {
  const { timers } = timerStore.getState();
  for (const entry of Object.values(timers)) {
    if (entry.isPaused) continue;
    if (triggeredAlarms.has(entry.id)) continue;
    const remaining = Math.max(ValueConstants.zero, Math.round((entry.endTimeMs - Date.now()) / 1000));
    if (remaining === ValueConstants.zero) {
      triggeredAlarms.add(entry.id);
      alarmStore.getState().trigger(entry.id, entry.recipeName);
    }
  }
};

const handleNotificationResponse = (
  response: NotificationsType.NotificationResponse | null,
): void => {
  if (response === null) return;
  const data = response.notification.request.content.data as Record<string, unknown> | undefined;
  if (data?.['type'] !== TIMER_COMPLETE) return;
  const timerId = typeof data['timerId'] === 'string' ? data['timerId'] : 'unknown';
  const recipeName = typeof data['recipeName'] === 'string' ? data['recipeName'] : CharConstants.empty;

  if (response.actionIdentifier === DISMISS_ALARM_ACTION) {
    // User tapped "Kapat" on the notification — stop the timer and cancel
    // all remaining reminder notifications without opening the alarm screen.
    void stopTimer(timerId);
    return;
  }

  alarmStore.getState().trigger(timerId, recipeName);
};

/**
 * App-global timer bridge, mounted once at the app root.
 *
 * - Checks for completed timers every second while app is in the foreground.
 * - Re-checks immediately when the app returns to the foreground.
 * - Handles "timer done" notification taps (warm-start and cold-start).
 */
export const useTimerNotificationSync = (): void => {
  useEffect(() => {
    const interval = setInterval(checkForCompletedTimers, TICK_MS);

    const handleAppState = (nextState: AppStateStatus): void => {
      if (nextState === 'active') checkForCompletedTimers();
    };
    const appStateSub = AppState.addEventListener('change', handleAppState);

    // Check on mount in case a timer already expired before this hook ran.
    checkForCompletedTimers();

    if (Platform.OS === 'web') {
      return () => {
        clearInterval(interval);
        appStateSub.remove();
      };
    }

    // Warm-start: notification tapped while app is already running.
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (r: NotificationsType.NotificationResponse) => handleNotificationResponse(r),
    );

    // Cold-start: app launched by tapping the notification.
    void (Notifications.getLastNotificationResponseAsync() as Promise<NotificationsType.NotificationResponse | null>).then(
      handleNotificationResponse,
    );

    return () => {
      clearInterval(interval);
      appStateSub.remove();
      responseSub.remove();
    };
  }, []);
};
