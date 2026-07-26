import type { NotificationEntity } from '@domain/notifications/notification-entity';

export interface NotificationListResult {
  items: NotificationEntity[];
  total: number;
  unreadCount: number;
}
