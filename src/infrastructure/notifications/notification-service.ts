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
import { TIMER_WARNING } from '@domain/timers/timer-warning-keys';
import { ENGAGEMENT_REMINDER } from '@domain/notifications/reminders/reminder-notification-keys';
import { replaceScheduledReminders } from '@infrastructure/notifications/replace-scheduled-reminders';
import { listenReminderOpened } from '@infrastructure/notifications/listen-reminder-opened';
import type { ReminderOpened } from '@domain/notifications/reminders/reminder-opened';
import type { TimerWarningAlert } from '@domain/timers/timer-warning-alert';
import type { ReminderNotification } from '@domain/notifications/reminders/reminder-notification';
import {
  ALERT_CHANNEL,
  WARNING_CHANNEL,
  registerNotificationChannels,
} from '@infrastructure/notifications/notification-channels';

if (__DEV__) {
  LogBox.ignoreLogs([
    'expo-notifications: Android Push notifications',
    '`expo-notifications` functionality is not fully supported',
  ]);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications = require('expo-notifications') as typeof NotificationsType;

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
 * - **Channels:** alarm, quiet heads-up and reminder each have their own
 *   (`notification-channels.ts`); the alarm's is v4 because v3 shipped silent.
 * - **Quiet in the foreground:** a heads-up or reminder that arrives while the
 *   app is open plays no sound, and a reminder shows nothing at all; the user is
 *   already here.
 * - **One notification, not a series.** The in-app expo-audio loop is the
 *   continuous alert; the follow-up nudges exist only for a backgrounded app.
 */
export class NotificationService implements NotificationServiceInterface {
  async init(copy: NotificationCopy): Promise<void> {
    if (isWeb()) return;
    try {
      Notifications.setNotificationHandler({
        handleNotification: async (n: NotificationsType.Notification) => {
          const type = (n.request.content.data as Record<string, unknown> | undefined)?.['type'];
          const isReminder = type === ENGAGEMENT_REMINDER;
          return {
            shouldShowBanner: !isReminder,
            shouldShowList: !isReminder,
            shouldPlaySound: type !== TIMER_WARNING && !isReminder,
            shouldSetBadge: false,
          };
        },
      });

      await Notifications.setNotificationCategoryAsync(TIMER_ALERT_CATEGORY, [
        {
          identifier: DISMISS_ALARM_ACTION,
          buttonTitle: copy.dismissAction,
          options: {
            isDestructive: true,
            // Run the action without foregrounding the app.
            opensAppToForeground: false,
          },
        },
      ]);

      if (isAndroid()) await registerNotificationChannels(Notifications, copy);
    } catch {
      // Notifications unavailable (e.g. Expo Go limitations). Timers still run.
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (isWeb()) return false;
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (existing === PermissionStatus.GRANTED) return true;
      const { status } = await Notifications.requestPermissionsAsync();
      return status === PermissionStatus.GRANTED;
    } catch {
      return false;
    }
  }

  async hasPermission(): Promise<boolean> {
    if (isWeb()) return false;
    try {
      const { status } = await Notifications.getPermissionsAsync();
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
    const all = [endTimeMs];
    for (let i = ValueConstants.one; i <= REMINDER_COUNT; i++) {
      all.push(endTimeMs + i * REMINDER_INTERVAL_MS);
    }
    const results = await Promise.all(
      all.map((t) =>
        this.scheduleIn(t, ALERT_CHANNEL, {
          title: `${ALARM_EMOJI} ${recipeName}`,
          body,
          // iOS reads sound from content; Android from the channel.
          sound: isIos() ? 'default' : undefined,
          categoryIdentifier: TIMER_ALERT_CATEGORY,
          data: { type: TIMER_COMPLETE, timerId, recipeName },
        }),
      ),
    );
    return results.filter((id): id is string => id !== null);
  }

  async scheduleTimerWarnings(
    timerId: string,
    recipeName: string,
    alerts: readonly TimerWarningAlert[],
  ): Promise<string[]> {
    if (isWeb()) return [];
    const results = await Promise.all(
      alerts.map((alert) =>
        this.scheduleIn(alert.fireAtMs, WARNING_CHANNEL, {
          title: `${ALARM_EMOJI} ${recipeName}`,
          body: alert.body,
          data: { type: TIMER_WARNING, timerId, recipeName },
        }),
      ),
    );
    return results.filter((id): id is string => id !== null);
  }

  async replaceReminders(reminders: readonly ReminderNotification[]): Promise<void> {
    if (isWeb()) return;
    await replaceScheduledReminders(Notifications, reminders);
  }

  onReminderOpened(listener: (opened: ReminderOpened) => void): () => void {
    if (isWeb()) return () => undefined;
    return listenReminderOpened(Notifications, listener);
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

  /** Schedules one notification `fireAtMs` from now on `channelId`; `null` when the OS refuses it. */
  private async scheduleIn(
    fireAtMs: number,
    channelId: string,
    content: NotificationsType.NotificationContentInput,
  ): Promise<string | null> {
    const delaySeconds = Math.max(
      MIN_NOTIFICATION_DELAY_SECONDS,
      Math.round((fireAtMs - Date.now()) / TimeConstants.millisecondsPerSecond),
    );
    try {
      return await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delaySeconds,
          ...(isAndroid() && { channelId }),
        },
      });
    } catch {
      return null;
    }
  }
}
