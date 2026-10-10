import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { PagedList } from '@application/store/paging/paged-list';
import type { NotificationEntity } from '@domain/notifications/notification-entity';

export interface NotificationsStoreState {
  state: PagedList<NotificationEntity>;
  /**
   * App-wide unread badge count, kept fresh independently of whether the full
   * notifications list has been loaded. Polled by `refreshUnread` so the bell
   * badge climbs as new notifications arrive, and cleared by `markAllRead`.
   */
  unreadCount: number;
  load: () => Promise<void>;
  /** The next page of the feed, on scroll; a no-op while one is in flight or none remains. */
  loadMore: () => Promise<void>;
  refreshUnread: () => Promise<void>;
  /** Optimistic; a refusal re-reads the inbox and is answered, so the screen can say so. */
  markAllRead: () => Promise<Result<void, Failure>>;
  /** Marks a single notification as read (optimistic; reloads on failure). */
  markOneRead: (id: string) => Promise<void>;
  /** Resets the feed and badge to their initial state. Called when the session ends; drops any answer still in flight. */
  clear: () => void;
}
