import type * as NotificationsType from 'expo-notifications';
import type { ReminderNotification } from '@domain/notifications/reminders/reminder-notification';
import { ENGAGEMENT_REMINDER } from '@domain/notifications/reminders/reminder-notification-keys';
import { isAndroid } from '@infrastructure/constants/platform';
import { REMINDER_CHANNEL } from '@infrastructure/notifications/notification-channels';

const isReminder = (request: NotificationsType.NotificationRequest): boolean =>
  (request.content.data as Record<string, unknown> | undefined)?.['type'] === ENGAGEMENT_REMINDER;

/**
 * Swaps the pending come-back series for `reminders`.
 *
 * @remarks
 * - **Found by type, not by stored ids:** the pending reminders are read back from the OS and
 *   matched on `data.type`, so a series scheduled by an older install or lost ids never piles up.
 * - **Timer notifications are untouched:** only reminders match the filter.
 * - **Best-effort:** a reminder that fails to schedule is simply not sent; nothing throws.
 */
export const replaceScheduledReminders = async (
  notifications: typeof NotificationsType,
  reminders: readonly ReminderNotification[],
): Promise<void> => {
  try {
    const pending = await notifications.getAllScheduledNotificationsAsync();
    await Promise.allSettled(
      pending.filter(isReminder).map((r) => notifications.cancelScheduledNotificationAsync(r.identifier)),
    );
    await Promise.allSettled(
      reminders.map((r) =>
        notifications.scheduleNotificationAsync({
          content: { title: r.title, body: r.body, data: { type: ENGAGEMENT_REMINDER, day: r.day, variant: r.variant } },
          trigger: {
            type: notifications.SchedulableTriggerInputTypes.DATE,
            date: r.fireAtMs,
            ...(isAndroid() && { channelId: REMINDER_CHANNEL }),
          },
        }),
      ),
    );
  } catch {
    // The pending list could not be read; leave the OS state as it is.
  }
};
