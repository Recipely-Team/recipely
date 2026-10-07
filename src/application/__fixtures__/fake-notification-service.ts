import type { ScheduleTimerCompleteCall } from "@application/__fixtures__/schedule-timer-complete-call";
import { ValueConstants } from "@core/constants";
import type { NotificationServiceInterface } from "@domain/notifications/notification-service-interface";
import type { TimerWarningAlert } from "@domain/timers/timer-warning-alert";
import type { ReminderNotification } from "@domain/notifications/reminders/reminder-notification";

/**
 * Recording test double for `NotificationServiceInterface`. It performs no real
 * scheduling but records every call so tests can assert on invocation counts
 * and arguments without a spy framework. `permissionGranted` and `scheduledIds`
 * are public so a test can arrange the return values it needs.
 */
export class FakeNotificationService implements NotificationServiceInterface {
  initCount = ValueConstants.zero;
  requestPermissionsCount = ValueConstants.zero;
  scheduleCalls: ScheduleTimerCompleteCall[] = [];
  cancelCalls: string[][] = [];
  warningCalls: (readonly TimerWarningAlert[])[] = [];
  reminderCalls: (readonly ReminderNotification[])[] = [];

  permissionGranted = true;
  scheduledIds: string[] = ["notif-1", "notif-2", "notif-3"];
  warningIds: string[] = [];

  init(): Promise<void> {
    this.initCount++;
    return Promise.resolve();
  }

  requestPermissions(): Promise<boolean> {
    this.requestPermissionsCount++;
    return Promise.resolve(this.permissionGranted);
  }

  hasPermission(): Promise<boolean> {
    return Promise.resolve(this.permissionGranted);
  }

  scheduleTimerWarnings(_timerId: string, _recipeName: string, alerts: readonly TimerWarningAlert[]): Promise<string[]> {
    this.warningCalls.push(alerts);
    return Promise.resolve(this.warningIds);
  }

  replaceReminders(reminders: readonly ReminderNotification[]): Promise<void> {
    this.reminderCalls.push(reminders);
    return Promise.resolve();
  }

  scheduleTimerComplete(
    timerId: string,
    recipeName: string,
    endTimeMs: number,
  ): Promise<string[]> {
    this.scheduleCalls.push({ timerId, recipeName, endTimeMs });
    return Promise.resolve(this.scheduledIds);
  }

  cancel(notifIds: string[]): Promise<void> {
    this.cancelCalls.push(notifIds);
    return Promise.resolve();
  }
}
