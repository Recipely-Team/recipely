import { NotificationFilter } from '@presentation/app/notifications/model/notification-filter';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import type { SectionData } from '@presentation/app/notifications/model/section-data';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/**
 * Groups the visible notifications into today / yesterday / earlier.
 *
 * Empty groups are dropped rather than rendered with a header and nothing
 * under it, which read as a loading state.
 */
export const buildSections = (items: NotifItem[], filter: NotificationFilter): SectionData[] => {
  const visible = filter === NotificationFilter.Unread ? items.filter((n) => !n.read) : items;
  const today = visible.filter((n) => n.daysAgo === ValueConstants.zero);
  const yesterday = visible.filter((n) => n.daysAgo === ValueConstants.one);
  const earlier = visible.filter((n) => n.daysAgo > ValueConstants.one);
  const sections: SectionData[] = [];
  const labels = t().notifications;
  if (today.length > ValueConstants.zero) sections.push({ title: labels.today, data: today });
  if (yesterday.length > ValueConstants.zero) sections.push({ title: labels.yesterday, data: yesterday });
  if (earlier.length > ValueConstants.zero) sections.push({ title: labels.earlier, data: earlier });
  return sections;
};
