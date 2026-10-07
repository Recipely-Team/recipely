import type { NotificationServiceInterface } from '@domain/notifications/notification-service-interface';
import type { PreferenceStoreInterface } from '@domain/storage/preference-store-interface';
import { PreferenceSlot } from '@domain/storage/preference-slot';
import type { ReminderCopy } from '@domain/notifications/reminders/reminder-copy';
import { RemindersChoice } from '@domain/notifications/reminders/reminders-choice';
import type { RefreshRemindersUseCase } from '@application/notifications/reminders/refresh-reminders-use-case';

/**
 * **Records the user's answer** to "may we remind you?" and applies it at once.
 *
 * @remarks
 * - **A yes asks the OS too:** when the permission prompt is declined, the stored answer is no, so
 *   the Settings switch shows the truth instead of an "on" that sends nothing.
 * - **Returns whether reminders are now on**, for the switch to settle on.
 */
export class SetRemindersChoiceUseCase {
  constructor(
    private readonly notifications: NotificationServiceInterface,
    private readonly prefs: PreferenceStoreInterface,
    private readonly refresh: RefreshRemindersUseCase,
  ) {}

  async execute(wantsReminders: boolean, copies: readonly ReminderCopy[], nowMs: number): Promise<boolean> {
    const on = wantsReminders && (await this.notifications.requestPermissions());
    await this.prefs.set(PreferenceSlot.RemindersChoice, on ? RemindersChoice.On : RemindersChoice.Off);
    await this.refresh.execute(copies, nowMs);
    return on;
  }
}
