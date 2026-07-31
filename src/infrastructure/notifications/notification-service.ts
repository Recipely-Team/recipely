import { LogBox, Platform } from 'react-native';
import type * as NotificationsType from 'expo-notifications';
import type { NotificationServiceInterface } from '@domain/notifications/notification-service-interface';
import {
  TIMER_COMPLETE,
  DISMISS_ALARM_ACTION,
} from '@domain/notifications/timer-notification-keys';
import { TimeConstants, ValueConstants } from '@core/constants';
import { ALARM_VIBRATION_PATTERN } from '@infrastructure/constants/notifications';

// WHY: expo-notifications logs console.error on Android Expo Go (SDK 53+) at
// module load time. ES `import` is hoisted before any code, so suppression
// registered after the import comes too late. `import type` is erased at
// runtime (no module loading), so LogBox.ignoreLogs registers first and the
// pattern is active before `require` triggers expo-notifications initialization.
if (__DEV__) {
  LogBox.ignoreLogs([
    'expo-notifications: Android Push notifications',
    '`expo-notifications` functionality is not fully supported',
  ]);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications = require('expo-notifications') as typeof NotificationsType;

// WHY: channel ID bumped to v4. v3 was created on devices with sound:'alarm'
// (custom file that doesn't exist) and then patched to sound:'default' (string).
// Android channel properties are immutable after creation, AND 'default' as a
// string looks for a res/raw file named "default" — which doesn't exist, so
// the channel is silent. v4 uses sound:true (boolean) which is the correct
// API value for "use the device's default notification sound".
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
 * Schedules and cancels local timer-completion notifications via the platform
 * notification API. Every method is a no-op on web, where local notifications
 * are unsupported and the in-app alarm overlay is the sole alert.
 */
export class NotificationService implements NotificationServiceInterface {
  async init(): Promise<void> {
    if (Platform.OS === 'web') return;
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
          buttonTitle: 'Kapat',
          options: {
            isDestructive: true,
            // opensAppToForeground: false lets the action run without bringing
            // the app to the foreground. If the app is fully killed the OS may
            // still open it briefly, but the intent is minimal interruption.
            opensAppToForeground: false,
          },
        },
      ]);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(ALERT_CHANNEL, {
          name: 'Cooking Timer (alarm)',
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
    if (Platform.OS === 'web') return false;
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (existing === 'granted') return true;
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
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
  ): Promise<string[]> {
    if (Platform.OS === 'web') return [];
    const ids: string[] = [];
    const all = [endTimeMs];
    for (let i = ValueConstants.one; i <= REMINDER_COUNT; i++) {
      all.push(endTimeMs + i * REMINDER_INTERVAL_MS);
    }
    const results = await Promise.all(all.map((t) => this.scheduleSingle(timerId, recipeName, t)));
    for (const id of results) {
      if (id !== null) ids.push(id);
    }
    return ids;
  }

  async cancel(notifIds: string[]): Promise<void> {
    if (Platform.OS === 'web') return;
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
  ): Promise<string | null> {
    const delaySeconds = Math.max(1, Math.round((fireAtMs - Date.now()) / 1000));
    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ ${recipeName}`,
          body: 'Timer is done! Tap to dismiss.',
          // iOS reads sound from content; Android ignores it (channel sets sound).
          // Using 'default' until a native build bundles alarm.mp3 in the app.
          sound: Platform.OS === 'ios' ? 'default' : undefined,
          categoryIdentifier: TIMER_ALERT_CATEGORY,
          data: { type: TIMER_COMPLETE, timerId, recipeName },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delaySeconds,
          ...(Platform.OS === 'android' && { channelId: ALERT_CHANNEL }),
        },
      });
    } catch {
      return null;
    }
  }
}
