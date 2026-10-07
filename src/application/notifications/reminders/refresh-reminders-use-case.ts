import { TimeConstants, ValueConstants } from '@core/constants';
import type { NotificationServiceInterface } from '@domain/notifications/notification-service-interface';
import type { PreferenceStoreInterface } from '@domain/storage/preference-store-interface';
import type { ReminderCopy } from '@domain/notifications/reminders/reminder-copy';
import type { ReminderNotification } from '@domain/notifications/reminders/reminder-notification';
import { RemindersChoice } from '@domain/notifications/reminders/reminders-choice';
import { reminderSchedule } from '@domain/notifications/reminders/reminder-schedule';
import { readRemindersChoice } from '@application/notifications/reminders/read-reminders-choice';

/**
 * **Restarts the come-back series** from now; run on every launch and every return to the foreground.
 *
 * @remarks
 * - **Opt-in only:** without a stored yes, or without OS permission, it clears any pending series
 *   instead, so turning the switch off or revoking permission leaves nothing behind.
 * - **Copy rotates:** consecutive reminders show different variants, and the starting variant moves
 *   with the day, so two series do not open with the same line.
 * - **Never fails:** every step is best-effort; a reminder that cannot be scheduled is not sent.
 */
export class RefreshRemindersUseCase {
  constructor(
    private readonly notifications: NotificationServiceInterface,
    private readonly prefs: PreferenceStoreInterface,
  ) {}

  async execute(copies: readonly ReminderCopy[], nowMs: number): Promise<void> {
    const optedIn = (await readRemindersChoice(this.prefs)) === RemindersChoice.On;
    if (!optedIn || copies.length === ValueConstants.zero || !(await this.notifications.hasPermission())) {
      await this.notifications.replaceReminders([]);
      return;
    }
    const offset = Math.floor(nowMs / TimeConstants.millisecondsPerDay) % copies.length;
    const reminders = reminderSchedule(nowMs).map((slot, i): ReminderNotification => {
      const variant = (offset + i) % copies.length;
      const copy = copies[variant] ?? copies[ValueConstants.zero]!;
      return { ...slot, title: copy.title, body: copy.body, variant };
    });
    await this.notifications.replaceReminders(reminders);
  }
}
