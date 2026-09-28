import type { NotifKind } from '@presentation/app/notifications/model/notif-kind';
import type { ImportSource } from '@presentation/app/notifications/model/import-source';
import type { NotificationTarget } from '@domain/notifications/notification-target';

export interface NotifItem {
  id: string;
  kind: NotifKind;
  actor: string;
  recipeName?: string;
  daysAgo: number;
  read: boolean;
  body?: string;
  /** Where an import's recipe came from; absent for other kinds and for older import rows. */
  source?: ImportSource;
  /** Where tapping the row navigates; `null` makes the row non-actionable. */
  target: NotificationTarget | null;
}
