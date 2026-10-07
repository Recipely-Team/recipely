import type * as NotificationsType from 'expo-notifications';
import type { ReminderOpened } from '@domain/notifications/reminders/reminder-opened';
import { ENGAGEMENT_REMINDER } from '@domain/notifications/reminders/reminder-notification-keys';

/** Reported when a tapped reminder carries no day or variant (scheduled by another build). */
const UNKNOWN_FIELD = -1;

/**
 * Calls `listener` once per tapped come-back reminder, including the tap that launched the app.
 *
 * @remarks
 * - **Once per tap:** the launch response can arrive both through the listener and through
 *   `getLastNotificationResponseAsync`; responses are de-duplicated by request identifier.
 * - **Reminders only:** timer alarms and heads-ups are ignored here; the timer sync owns them.
 * - Returns the unsubscribe function.
 */
export const listenReminderOpened = (
  notifications: typeof NotificationsType,
  listener: (opened: ReminderOpened) => void,
): (() => void) => {
  const seen = new Set<string>();
  const handle = (response: NotificationsType.NotificationResponse | null): void => {
    const request = response?.notification.request;
    const data = request?.content.data as Record<string, unknown> | undefined;
    if (request === undefined || data?.['type'] !== ENGAGEMENT_REMINDER || seen.has(request.identifier)) return;
    seen.add(request.identifier);
    listener({
      day: typeof data['day'] === 'number' ? data['day'] : UNKNOWN_FIELD,
      variant: typeof data['variant'] === 'number' ? data['variant'] : UNKNOWN_FIELD,
    });
  };
  const subscription = notifications.addNotificationResponseReceivedListener(handle);
  void notifications.getLastNotificationResponseAsync().then(handle).catch(() => undefined);
  return () => subscription.remove();
};
