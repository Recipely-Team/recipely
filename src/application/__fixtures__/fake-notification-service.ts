import type { NotificationServiceInterface } from '@domain/notifications/notification-service-interface';
import type { ScheduleTimerCompleteCall } from '@application/__fixtures__/schedule-timer-complete-call';
import { ValueConstants } from '@core/constants';

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

  permissionGranted = true;
  scheduledIds: string[] = ['notif-1', 'notif-2', 'notif-3'];

  init(): Promise<void> {
    this.initCount += 1;
    return Promise.resolve();
  }

  requestPermissions(): Promise<boolean> {
    this.requestPermissionsCount += 1;
    return Promise.resolve(this.permissionGranted);
  }

  scheduleTimerComplete(timerId: string, recipeName: string, endTimeMs: number): Promise<string[]> {
    this.scheduleCalls.push({ timerId, recipeName, endTimeMs });
    return Promise.resolve(this.scheduledIds);
  }

  cancel(notifIds: string[]): Promise<void> {
    this.cancelCalls.push(notifIds);
    return Promise.resolve();
  }
}
