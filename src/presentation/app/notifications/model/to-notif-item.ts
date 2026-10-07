import type { NotificationEntity } from '@domain/notifications/notification-entity';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import { NotifKind } from '@presentation/app/notifications/model/notif-kind';
import { TimeConstants, ValueConstants } from '@core/constants';
import type { ImportSource } from '@presentation/app/notifications/model/import-source';
import { SiteMetadata } from '@presentation/base/constants/site-metadata';

/** The kinds this build knows how to draw; anything newer falls back to `generic`. */
const KNOWN_KINDS = new Set<NotifKind>([
  NotifKind.Comment,
  NotifKind.Like,
  NotifKind.Favorite,
  NotifKind.AiDone,
  NotifKind.ImportDone,
  NotifKind.ImportFailed,
  NotifKind.ModerationApproved,
  NotifKind.ModerationPending,
  NotifKind.Follow,
  NotifKind.CreatorApproved,
  NotifKind.CreatorRejected,
]);

/** What a notification with no sender is attributed to. */
const SYSTEM_ACTOR = SiteMetadata.appName;

/**
 * One notification, as the list renders it.
 *
 * The backend adds kinds without asking the app first, so an unrecognised type
 * becomes `generic` rather than a row with no icon and no copy.
 */
export const toNotifItem = (notification: NotificationEntity): NotifItem => ({
  id: notification.id,
  kind: resolveKind(notification),
  actor: notification.senderDisplayName ?? SYSTEM_ACTOR,
  recipeName: notification.recipeTitle ?? undefined,
  daysAgo: daysSince(notification.createdAt),
  read: notification.read,
  // Surface free-text payload (e.g. the comment body) as the secondary line.
  body: notification.message ?? undefined,
  target: notification.target,
  ...importSourceOf(notification),
  ...creatorAccountOf(notification),
});

/** The account a creator decision names; nothing for other kinds, or a platform this build cannot name. */
function creatorAccountOf(notification: NotificationEntity): Pick<NotifItem, 'creator'> {
  const platform = notification.creatorPlatform;
  return platform === null ? {} : { creator: { platform, handle: notification.sourceHandle } };
}

/** The platform (and account) an import row names; nothing for a row the server wrote before it stored them. */
function importSourceOf(notification: NotificationEntity): { source?: ImportSource } {
  const platform = notification.sourcePlatform;
  if (platform === null) return {};
  const handle = notification.sourceHandle;
  return { source: handle === null ? { platform } : { platform, handle } };
}

/** A failed import is its own kind; a type this build cannot draw falls back to `generic`. */
function resolveKind(notification: NotificationEntity): NotifKind {
  if (notification.isFailedImport) return NotifKind.ImportFailed;
  const raw = notification.type;
  return KNOWN_KINDS.has(raw as NotifKind) ? (raw as NotifKind) : NotifKind.Generic;
}

/** Whole days, which is all the date grouping and the row's caption need. */
function daysSince(createdAt: Date): number {
  return Math.max(ValueConstants.zero, Math.floor((Date.now() - createdAt.getTime()) / TimeConstants.millisecondsPerDay));
}
