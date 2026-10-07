import type { Page } from '@domain/common/page';
import type { NotificationEntity } from '@domain/notifications/notification-entity';

/** One page of the feed, with the account's unread count the backend sends alongside any page. */
export interface NotificationListResult {
  page: Page<NotificationEntity>;
  unreadCount: number;
}
