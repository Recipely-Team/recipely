import type { BoundStore } from '@application/store/bound-store';
import { create } from 'zustand';
import type { NotificationsStoreState } from '@application/notifications/notifications-store-state';
import { ValueConstants } from '@core/constants';

import type { ListNotificationsUseCase } from '@application/notifications/list/list-notifications-use-case';
import type { MarkAllReadUseCase } from '@application/notifications/read/mark-all-read-use-case';
import type { MarkOneReadUseCase } from '@application/notifications/read/mark-one-read-use-case';

interface NotificationsStoreDeps {
  listNotifications: ListNotificationsUseCase;
  markAllRead: MarkAllReadUseCase;
  markOneRead: MarkOneReadUseCase;
}

/**
 * Owns the in-memory notifications feed for the current session. The store is
 * idle until a screen first calls `load`. `refreshUnread` keeps the badge count
 * current without fetching the whole feed (used by the app-wide poller).
 * `markAllRead` / `markOneRead` perform optimistic updates; on failure the feed
 * is reloaded so the source of truth always wins.
 */
export const configureNotificationsStore = (
  deps: NotificationsStoreDeps,
): BoundStore<NotificationsStoreState> => {
  return create<NotificationsStoreState>((set, get) => ({
    state: { status: 'idle' },
    unreadCount: ValueConstants.zero,
    load: async () => {
      set({ state: { status: 'loading' } });
      const result = await deps.listNotifications.execute();
      if (!result.ok) {
        set({ state: { status: 'error', failure: result.failure } });
        return;
      }
      set({
        state: {
          status: 'loaded',
          items: result.value.items,
          total: result.value.total,
          unreadCount: result.value.unreadCount,
        },
        unreadCount: result.value.unreadCount,
      });
    },
    refreshUnread: async () => {
      // Fetch the minimum page — the endpoint returns unreadCount regardless of
      // page size, so we only pay for one item to keep the badge fresh.
      const result = await deps.listNotifications.execute({ limit: 1 });
      if (!result.ok) return;
      set({ unreadCount: result.value.unreadCount });
    },
    markAllRead: async () => {
      const current = get().state;
      if (current.status !== 'loaded') {
        // List not loaded — still clear the badge optimistically and persist.
        set({ unreadCount: ValueConstants.zero });
        const earlyResult = await deps.markAllRead.execute();
        if (!earlyResult.ok) await get().refreshUnread();
        return;
      }
      const optimisticItems = current.items.map((n) => n.asRead());
      set({
        state: {
          ...current,
          items: optimisticItems,
          unreadCount: ValueConstants.zero,
        },
        unreadCount: ValueConstants.zero,
      });
      const result = await deps.markAllRead.execute();
      if (!result.ok) {
        await get().load();
      }
    },
    markOneRead: async (id: string) => {
      const current = get().state;
      if (current.status !== 'loaded') return;
      const target = current.items.find((n) => n.id === id);
      if (target === undefined || target.read) return;
      const optimisticItems = current.items.map((n) => (n.id === id ? n.asRead() : n));
      const nextUnread = Math.max(ValueConstants.zero, current.unreadCount - 1);
      set({
        state: { ...current, items: optimisticItems, unreadCount: nextUnread },
        unreadCount: nextUnread,
      });
      const result = await deps.markOneRead.execute(id);
      if (!result.ok) {
        await get().load();
      }
    },
    clear: () => set({ state: { status: 'idle' }, unreadCount: ValueConstants.zero }),
  }));
};
