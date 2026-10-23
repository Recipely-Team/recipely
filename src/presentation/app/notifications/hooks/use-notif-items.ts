import { useMemo, useRef } from 'react';
import type { PagedList } from '@application/store/paging/paged-list';
import { StoreStatus } from '@application/store/store-status';
import type { NotificationEntity } from '@domain/notifications/notification-entity';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import { toNotifItem } from '@presentation/app/notifications/model/to-notif-item';

/**
 * The inbox as row items, one per notification.
 *
 * @remarks
 * - **One item per entity, kept.** The inbox hands back the same entity for
 *   every row a mark did not touch, so reusing its item lets the memoised rows
 *   skip: marking one read re-renders that row, not the page of them.
 * - **"N days ago" is computed when the entity arrives**, so a row nobody
 *   touched keeps its label until the inbox is reloaded.
 */
export const useNotifItems = (state: PagedList<NotificationEntity>): NotifItem[] => {
  const byEntity = useRef(new WeakMap<NotificationEntity, NotifItem>());
  return useMemo(() => {
    if (state.status !== StoreStatus.Loaded) return [];
    return state.items.map((entity) => {
      const cached = byEntity.current.get(entity);
      if (cached !== undefined) return cached;
      const item = toNotifItem(entity);
      byEntity.current.set(entity, item);
      return item;
    });
  }, [state]);
};
