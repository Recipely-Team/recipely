import type { NotificationServiceInterface } from '@domain/notifications/notification-service-interface';
import type { PreferenceStoreInterface } from '@domain/storage/preference-store-interface';
import { RemindersChoice } from '@domain/notifications/reminders/reminders-choice';
import { readRemindersChoice } from '@application/notifications/reminders/read-reminders-choice';

/** True when reminders are really on: the user said yes AND the OS still lets us notify. */
export class GetRemindersEnabledUseCase {
  constructor(
    private readonly notifications: NotificationServiceInterface,
    private readonly prefs: PreferenceStoreInterface,
  ) {}

  async execute(): Promise<boolean> {
    if ((await readRemindersChoice(this.prefs)) !== RemindersChoice.On) return false;
    return this.notifications.hasPermission();
  }
}
