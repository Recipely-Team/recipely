import { ValueConstants } from '@core/constants';
import type { NotificationEntity } from '@domain/notifications/notification-entity';

/**
 * **Notification inbox** — a read model over the loaded notifications and the
 * account's unread badge count, for optimistic read marks.
 *
 * @remarks
 * - **The count is the server's**, not derived from `items`: the feed may hold
 *   one page while the badge counts the whole account.
 * - **Unchanged means the same instance**: a mark that changes nothing returns
 *   `this`, so a caller can skip the write and the request.
 * - The count never drops below zero.
 */
export class NotificationInbox {
  private constructor(
    private readonly notifications: readonly NotificationEntity[],
    private readonly unread: number,
  ) {}

  static of(items: readonly NotificationEntity[], unreadCount: number): NotificationInbox {
    return new NotificationInbox(items, unreadCount);
  }

  get items(): readonly NotificationEntity[] {
    return this.notifications;
  }

  get unreadCount(): number {
    return this.unread;
  }

  markAllRead(): NotificationInbox {
    if (this.unread === ValueConstants.zero && this.notifications.every((n) => n.read)) return this;
    return new NotificationInbox(this.notifications.map((n) => n.asRead()), ValueConstants.zero);
  }

  markRead(id: string): NotificationInbox {
    const target = this.notifications.find((n) => n.id === id);
    if (target === undefined || target.read) return this;
    return new NotificationInbox(
      this.notifications.map((n) => (n.id === id ? n.asRead() : n)),
      Math.max(ValueConstants.zero, this.unread - ValueConstants.one),
    );
  }
}
