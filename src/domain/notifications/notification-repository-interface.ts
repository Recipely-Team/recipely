import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { NotificationListResult } from '@domain/notifications/notification-list-result';

/** Repository contract for backend notification operations. */
export interface NotificationRepositoryInterface {
  list(limit?: number, offset?: number): Promise<Result<NotificationListResult, Failure>>;
  markAllRead(): Promise<Result<void, Failure>>;
  markOneRead(id: string): Promise<Result<void, Failure>>;
  registerDeviceToken(
    token: string,
    platform: 'ios' | 'android' | 'web',
  ): Promise<Result<void, Failure>>;
}
