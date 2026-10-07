import type * as NotificationsType from 'expo-notifications';
import type { NotificationCopy } from '@domain/notifications/notification-copy';
import { ALARM_VIBRATION_PATTERN, WARNING_VIBRATION_PATTERN } from '@infrastructure/constants/notifications';

/** Timer alarm: loud, on the alarm stream. Channel properties are immutable, hence the version. */
export const ALERT_CHANNEL = 'recipely-timer-alert-v4';
/** Timer heads-ups: no sound, one short buzz; a watch mirrors it as a tap on the wrist. */
export const WARNING_CHANNEL = 'recipely-timer-warning-v1';
/** Come-back reminders: an ordinary notification, nothing alarm-like about it. */
export const REMINDER_CHANNEL = 'recipely-reminders-v1';

/** Android audio-attribute codes for the alarm stream (`AudioUsage.ALARM`, `AudioContentType.SONIFICATION`). */
const ALARM_AUDIO_USAGE = 4;
const SONIFICATION_CONTENT_TYPE = 4;

/**
 * Creates the three Android notification channels, named in the user's language.
 *
 * @remarks
 * - **Alarm sound is omitted, not 'default':** `'default'` resolves to `res/raw/default`, which does not
 *   exist, and gave v3 a silent channel; leaving it out uses the system sound.
 * - **The heads-up's `sound: null` is deliberate:** a heads-up that dings is a second alarm.
 */
export const registerNotificationChannels = async (
  notifications: typeof NotificationsType,
  copy: NotificationCopy,
): Promise<void> => {
  await notifications.setNotificationChannelAsync(ALERT_CHANNEL, {
    name: copy.channelName,
    importance: notifications.AndroidImportance.MAX,
    enableVibrate: true,
    // Copied: the API takes a mutable array.
    vibrationPattern: [...ALARM_VIBRATION_PATTERN],
    // Alarm stream, so it rings even with notification volume down.
    audioAttributes: { usage: ALARM_AUDIO_USAGE, contentType: SONIFICATION_CONTENT_TYPE },
  });
  await notifications.setNotificationChannelAsync(WARNING_CHANNEL, {
    name: copy.warningChannelName,
    importance: notifications.AndroidImportance.DEFAULT,
    sound: null,
    enableVibrate: true,
    vibrationPattern: [...WARNING_VIBRATION_PATTERN],
  });
  await notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
    name: copy.reminderChannelName,
    importance: notifications.AndroidImportance.DEFAULT,
  });
};
