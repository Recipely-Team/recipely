import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { NotificationListResult } from '@domain/notifications/notification-list-result';
import type { DevicePlatform } from '@domain/notifications/device-platform';

/** Repository contract for backend notification operations. */
export interface NotificationRepositoryInterface {
  /** One 1-based page of the feed. */
  list(page: number, pageSize: number): Promise<Result<NotificationListResult, Failure>>;
  markAllRead(): Promise<Result<void, Failure>>;
  markOneRead(id: string): Promise<Result<void, Failure>>;
  registerDeviceToken(
    token: string,
    platform: DevicePlatform,
  ): Promise<Result<void, Failure>>;
}
