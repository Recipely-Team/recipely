import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { NotificationEntity } from '@domain/notifications/notification-entity';

export type NotificationsState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Loaded; items: NotificationEntity[]; total: number; unreadCount: number }
  | { status: typeof StoreStatus.Error; failure: Failure };
