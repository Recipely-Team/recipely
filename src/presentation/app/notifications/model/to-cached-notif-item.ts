import type { NotificationEntity } from '@domain/notifications/notification-entity';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import { daysSince } from '@presentation/app/notifications/model/days-since';
import { toNotifItem } from '@presentation/app/notifications/model/to-notif-item';

const items = new WeakMap<NotificationEntity, NotifItem>();

/**
 * {@link toNotifItem}, returning the same object for the same entity.
 *
 * @remarks
 * - **Identity is what lets a row skip.** The inbox hands back the same entity
 *   for every notification a mark did not touch; the same item for it keeps
 *   the memoised row's props equal, so marking one read re-renders one row.
 * - **Re-made when its day ticks over**, so "2 days ago" does not outlive the
 *   day it was true on.
 * - **A WeakMap**: an entity the store let go of takes its item with it.
 */
export const toCachedNotifItem = (entity: NotificationEntity): NotifItem => {
  const cached = items.get(entity);
  if (cached !== undefined && cached.daysAgo === daysSince(entity.createdAt)) return cached;
  const item = toNotifItem(entity);
  items.set(entity, item);
  return item;
};
