import type { NotificationCopy } from '@domain/notifications/notification-copy';
import type { TimerWarningAlert } from '@domain/timers/timer-warning-alert';
import type { ReminderNotification } from '@domain/notifications/reminders/reminder-notification';
import type { ReminderOpened } from '@domain/notifications/reminders/reminder-opened';

/**
 * Port for scheduling local notifications: timer alarms and heads-ups, and come-back reminders.
 * The infrastructure implementation wraps the platform notification API (no-op on web);
 * consumers resolve it through the DI container instead of importing the platform module.
 */
export interface NotificationServiceInterface {
  /** Initializes notification handlers, categories, and channels. */
  init(copy: NotificationCopy): Promise<void>;
  /** Returns true when the user granted notification permission, asking if not yet decided. */
  requestPermissions(): Promise<boolean>;
  /** Returns true when notification permission is granted, without ever asking. */
  hasPermission(): Promise<boolean>;
  /** Schedules the completion alarm and returns the scheduled notification ids. */
  scheduleTimerComplete(
    timerId: string,
    recipeName: string,
    endTimeMs: number,
    body: string,
  ): Promise<string[]>;
  /** Schedules a timer's quiet "time is almost up" heads-ups and returns their ids. */
  scheduleTimerWarnings(timerId: string, recipeName: string, alerts: readonly TimerWarningAlert[]): Promise<string[]>;
  /** Cancels every pending come-back reminder and schedules `reminders` in their place. */
  replaceReminders(reminders: readonly ReminderNotification[]): Promise<void>;
  /** Calls `listener` once for each tapped come-back reminder; returns the unsubscribe. */
  onReminderOpened(listener: (opened: ReminderOpened) => void): () => void;
  /** Cancels displayed and scheduled notifications by id. */
  cancel(notifIds: string[]): Promise<void>;
}
