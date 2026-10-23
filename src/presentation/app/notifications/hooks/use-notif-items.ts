import { useMemo } from 'react';
import type { PagedList } from '@application/store/paging/paged-list';
import { StoreStatus } from '@application/store/store-status';
import type { NotificationEntity } from '@domain/notifications/notification-entity';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import { toCachedNotifItem } from '@presentation/app/notifications/model/to-cached-notif-item';

const NO_ITEMS: NotifItem[] = [];

/**
 * The inbox as row items, one per notification.
 *
 * @remarks
 * - **One item per entity, kept** ({@link toCachedNotifItem}): marking one
 *   read re-renders that row, not the page of them.
 */
export const useNotifItems = (state: PagedList<NotificationEntity>): NotifItem[] =>
  useMemo(() => (state.status === StoreStatus.Loaded ? state.items.map(toCachedNotifItem) : NO_ITEMS), [state]);
