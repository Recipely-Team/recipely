import { LogBox } from 'react-native';
import type { NotificationCopy } from '@domain/notifications/notification-copy';
import { PermissionStatus } from 'expo-modules-core';
import { isAndroid, isIos, isWeb } from '@infrastructure/constants/platform';
import type * as NotificationsType from 'expo-notifications';
import type { NotificationServiceInterface } from '@domain/notifications/notification-service-interface';
import {
  TIMER_COMPLETE,
  DISMISS_ALARM_ACTION,
} from '@domain/notifications/timer-notification-keys';
import { TimeConstants, ValueConstants } from '@core/constants';
import { ALARM_VIBRATION_PATTERN } from '@infrastructure/constants/notifications';

if (__DEV__) {
  LogBox.ignoreLogs([
    'expo-notifications: Android Push notifications',
    '`expo-notifications` functionality is not fully supported',
  ]);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications = require('expo-notifications') as typeof NotificationsType;

const ALERT_CHANNEL = 'recipely-timer-alert-v4';

// Notification category identifier — the "Kapat" dismiss action lives under it.
const TIMER_ALERT_CATEGORY = 'TIMER_ALERT';

// WHY: only one notification — the in-app expo-audio loop is the continuous
// alarm. Reminder notifications caused repeated dings every 2 min which
// felt like spam rather than an alarm. User dismisses via the alarm screen
// or the "Kapat" action on the single notification.
/** Gap between the alarm and each follow-up nudge. */
const REMINDER_INTERVAL_MINUTES = 2;
const REMINDER_INTERVAL_MS =
  REMINDER_INTERVAL_MINUTES * TimeConstants.secondsPerMinute * TimeConstants.millisecondsPerSecond;

const REMINDER_COUNT = ValueConstants.zero;

/**
 * The soonest a notification may be scheduled. A timer that has already elapsed
 * computes a non-positive delay, which the OS rejects outright; one second in
 * the future fires immediately and is accepted.
 */
const MIN_NOTIFICATION_DELAY_SECONDS = 1;

/** Prefixes the alarm title so it reads as a timer at a glance in the tray. */
const ALARM_EMOJI = '⏰';

/**
 * Schedules and cancels local timer-completion notifications via the platform
 * notification API. Every method is a no-op on web, where local notifications
 * are unsupported and the in-app alarm overlay is the sole alert.
 *
 * @remarks
 * - **The module is `require`d, not imported.** expo-notifications logs a
 *   `console.error` on Android Expo Go at module-load time, and an ES `import`
 *   is hoisted above any suppression. `import type` erases at runtime, so
 *   `LogBox.ignoreLogs` registers before `require` initialises the module.
 * - **Channel ID is v4.** Android channel properties are immutable once
 *   created: v3 shipped with a custom `sound:'alarm'` file that doesn't exist
 *   and was patched to the string `'default'`, which looks for `res/raw/default`
 *   — also missing, so the channel was silent. `sound: true` is the correct
 *   value for "the device's default sound".
 * - **One notification, not a series.** The in-app expo-audio loop is the
 *   continuous alert; the follow-up nudges exist only for a backgrounded app.
 */
export class NotificationService implements NotificationServiceInterface {
  async init(copy: NotificationCopy): Promise<void> {
    if (isWeb()) return;
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Register the "Kapat" action button — shown on both iOS (long-press /
      // expanded notification) and Android (notification action row).
      await Notifications.setNotificationCategoryAsync(TIMER_ALERT_CATEGORY, [
        {
          identifier: DISMISS_ALARM_ACTION,
          buttonTitle: copy.dismissAction,
          options: {
            isDestructive: true,
            // opensAppToForeground: false lets the action run without bringing
            // the app to the foreground. If the app is fully killed the OS may
            // still open it briefly, but the intent is minimal interruption.
            opensAppToForeground: false,
          },
        },
      ]);

      if (isAndroid()) {
        await Notifications.setNotificationChannelAsync(ALERT_CHANNEL, {
          name: copy.channelName,
          importance: Notifications.AndroidImportance.MAX,
          // WHY: omitting `sound` causes the Android channel manager to set
          // Settings.System.DEFAULT_NOTIFICATION_URI — the device's system
          // notification sound. Passing 'default' (string) mistakenly calls
          // mSoundResolver.resolve('default') which returns null (file not in
          // res/raw) → silent channel. Passing `true` is a TypeScript error.
          // So the only correct way for default sound is to omit the key.
          enableVibrate: true,
          // Copied: expo-notifications takes a mutable `number[]`, and the
          // constant must not be mutable shared state.
          vibrationPattern: [...ALARM_VIBRATION_PATTERN],
          // Route audio through the Alarm volume stream so it rings loudly
          // even when notification volume is turned down.
          audioAttributes: {
            usage: 4, // AudioUsage.ALARM
            contentType: 4, // AudioContentType.SONIFICATION
          },
        });
      }
    } catch {
      // Notifications unavailable (e.g. Expo Go limitations). Timers still run.
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (isWeb()) return false;
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (existing === 'granted') return true; // TO DO: static status names problem
      const { status } = await Notifications.requestPermissionsAsync();
      return status === PermissionStatus.GRANTED;
    } catch {
      return false;
    }
  }

  /**
   * Schedules the timer completion notification.
   * Returns the scheduled notification ID(s) so they can be cancelled on dismiss.
   */
  async scheduleTimerComplete(
    timerId: string,
    recipeName: string,
    endTimeMs: number,
    body: string,
  ): Promise<string[]> {
    if (isWeb()) return [];
    const ids: string[] = [];
    const all = [endTimeMs];
    for (let i = ValueConstants.one; i <= REMINDER_COUNT; i++) {
      all.push(endTimeMs + i * REMINDER_INTERVAL_MS);
    }
    const results = await Promise.all(
      all.map((t) => this.scheduleSingle(timerId, recipeName, t, body)),
    );
    for (const id of results) {
      if (id !== null) ids.push(id);
    }
    return ids;
  }

  async cancel(notifIds: string[]): Promise<void> {
    if (isWeb()) return;
    await Promise.allSettled(
      notifIds.flatMap((id) => [
        Notifications.dismissNotificationAsync(id),
        Notifications.cancelScheduledNotificationAsync(id),
      ]),
    );
  }

  private async scheduleSingle(
    timerId: string,
    recipeName: string,
    fireAtMs: number,
    body: string,
  ): Promise<string | null> {
    const delaySeconds = Math.max(
      MIN_NOTIFICATION_DELAY_SECONDS,
      Math.round((fireAtMs - Date.now()) / TimeConstants.millisecondsPerSecond),
    );
    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title: `${ALARM_EMOJI} ${recipeName}`,
          body,
          // iOS reads sound from content; Android ignores it (channel sets sound).
          // Using 'default' until a native build bundles alarm.mp3 in the app.
          sound: isIos() ? 'default' : undefined,
          categoryIdentifier: TIMER_ALERT_CATEGORY,
          data: { type: TIMER_COMPLETE, timerId, recipeName },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delaySeconds,
          ...(isAndroid() && { channelId: ALERT_CHANNEL }),
        },
      });
    } catch {
      return null;
    }
  }
}
