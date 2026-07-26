import type { Failure } from '@core/failure';
import type { NotificationEntity } from '@domain/notifications/notification-entity';

export type NotificationsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; items: NotificationEntity[]; total: number; unreadCount: number }
  | { status: 'error'; failure: Failure };
