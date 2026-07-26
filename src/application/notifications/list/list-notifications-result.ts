import type { NotificationEntity } from '@domain/notifications/notification-entity';

export interface ListNotificationsResult {
  items: NotificationEntity[];
  total: number;
  unreadCount: number;
}
