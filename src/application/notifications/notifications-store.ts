import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { create } from 'zustand';
import type { NotificationsStoreState } from '@application/notifications/notifications-store-state';
import { ValueConstants } from '@core/constants';
import type { Failure } from '@core/failure';
import type { Result } from '@core/result/result';
import { ok } from '@core/result/result-helpers';
import type { Page } from '@domain/common/page';
import type { NotificationEntity } from '@domain/notifications/notification-entity';
import { PagedListLoader } from '@application/store/paging/paged-list-loader';
import { RequestEpoch } from '@application/store/request-epoch';
import type { ListNotificationsUseCase } from '@application/notifications/list/list-notifications-use-case';
import type { MarkAllReadUseCase } from '@application/notifications/read/mark-all-read-use-case';
import type { MarkOneReadUseCase } from '@application/notifications/read/mark-one-read-use-case';
import { PageSizes } from '@application/config/page-sizes';

interface NotificationsStoreDeps {
  listNotifications: ListNotificationsUseCase;
  markAllRead: MarkAllReadUseCase;
  markOneRead: MarkOneReadUseCase;
}

/**
 * **Notifications store** — the in-memory feed and the app-wide unread badge
 * for the current session.
 *
 * @remarks
 * - **The feed is paged**: `load` reads the first page, `loadMore` the next on
 *   scroll (`PagedListLoader`); every page also refreshes the badge.
 * - **`refreshUnread`** keeps the badge current without the feed (the app-wide poller).
 * - **Marks are optimistic**; on failure a loaded feed is re-read so the source of truth wins.
 * - **Session guard**: `clear()` resets the loader and the badge epoch, so an
 *   answer in flight at sign-out never writes the old account back.
 */
export const configureNotificationsStore = (
  deps: NotificationsStoreDeps,
): BoundStore<NotificationsStoreState> =>
  create<NotificationsStoreState>((set, get) => {
    const feed = new PagedListLoader<NotificationEntity>(() => get().state, (state) => set({ state }), (n) => n.id);
    const badge = new RequestEpoch();

    const fetchPage = async (page: number): Promise<Result<Page<NotificationEntity>, Failure>> => {
      const isCurrent = badge.start();
      const result = await deps.listNotifications.execute({ page });
      if (!result.ok) return result;
      if (isCurrent()) set({ unreadCount: result.value.unreadCount });
      return ok(result.value.page);
    };

    const reread = async (): Promise<void> => {
      if (get().state.status === StoreStatus.Loaded) await feed.refresh(fetchPage);
    };

    return {
      state: { status: StoreStatus.Idle },
      unreadCount: ValueConstants.zero,
      load: () => feed.load(fetchPage),
      loadMore: () => feed.loadMore(),
      refreshUnread: async () => {
        const isCurrent = badge.start();
        const result = await deps.listNotifications.execute({ pageSize: PageSizes.unreadProbe });
        if (result.ok && isCurrent()) set({ unreadCount: result.value.unreadCount });
      },
      markAllRead: async () => {
        badge.invalidate();
        const current = get().state;
        if (current.status === StoreStatus.Loaded) set({ state: { ...current, items: current.items.map((n) => n.asRead()) } });
        set({ unreadCount: ValueConstants.zero });
        const result = await deps.markAllRead.execute();
        if (result.ok) return;
        if (current.status === StoreStatus.Loaded) await reread();
        else await get().refreshUnread();
      },
      markOneRead: async (id: string) => {
        const current = get().state;
        if (current.status !== StoreStatus.Loaded) return;
        const target = current.items.find((n) => n.id === id);
        if (target === undefined || target.read) return;
        set({
          state: { ...current, items: current.items.map((n) => (n.id === id ? n.asRead() : n)) },
          unreadCount: Math.max(ValueConstants.zero, get().unreadCount - ValueConstants.one),
        });
        const result = await deps.markOneRead.execute(id);
        if (!result.ok) await reread();
      },
      clear: () => {
        feed.reset();
        badge.invalidate();
        set({ unreadCount: ValueConstants.zero });
      },
    };
  });
