import type { NotificationEntity } from '@domain/notifications/notification-entity';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import { NotifKind } from '@presentation/app/notifications/model/notif-kind';
import { TimeConstants, ValueConstants } from '@core/constants';
import type { ImportSource } from '@presentation/app/notifications/model/import-source';

/** The kinds this build knows how to draw; anything newer falls back to `generic`. */
const KNOWN_KINDS = new Set<NotifKind>([
  'comment',
  'like',
  'favorite',
  'ai_done',
  'import_done',
  'import_failed',
  'moderation_approved',
  'moderation_pending',
  'follow',
]);

/** What a notification with no sender is attributed to. */
const SYSTEM_ACTOR = 'Recipely';

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
});

/** The platform (and account) an import row names; nothing for a row the server wrote before it stored them. */
function importSourceOf(notification: NotificationEntity): { source?: ImportSource } {
  const platform = notification.sourcePlatform;
  if (platform === null) return {};
  const handle = notification.sourceHandle;
  return { source: handle === null ? { platform } : { platform, handle } };
}

/**
 * The server sends a failed import as `import_done` too, with neither a draft
 * nor a recipe behind it; read as it came, the row told the user their recipe
 * was ready and then went nowhere when tapped.
 */
function resolveKind(notification: NotificationEntity): NotifKind {
  const raw = notification.type;
  if (raw === NotifKind.ImportDone && notification.target === null) return NotifKind.ImportFailed;
  return KNOWN_KINDS.has(raw as NotifKind) ? (raw as NotifKind) : NotifKind.Generic;
}

/** Whole days, which is all the date grouping and the row's caption need. */
function daysSince(createdAt: Date): number {
  const ms = Date.now() - createdAt.getTime();
  return Math.max(
    ValueConstants.zero,
    Math.floor(
      ms /
        (TimeConstants.millisecondsPerSecond *
          TimeConstants.secondsPerMinute *
          TimeConstants.minutesPerHour *
          TimeConstants.hoursPerDay),
    ),
  );
}
