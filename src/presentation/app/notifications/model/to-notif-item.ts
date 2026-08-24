import type { NotificationEntity } from '@domain/notifications/notification-entity';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import type { NotifKind } from '@presentation/app/notifications/model/notif-kind';
import { TimeConstants, ValueConstants } from '@core/constants';

/** The kinds this build knows how to draw; anything newer falls back to `generic`. */
const KNOWN_KINDS = new Set<NotifKind>([
  'comment',
  'like',
  'favorite',
  'ai_done',
  'import_done',
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
  kind: resolveKind(notification.type),
  actor: notification.senderDisplayName ?? SYSTEM_ACTOR,
  recipeName: notification.recipeTitle ?? undefined,
  daysAgo: daysSince(notification.createdAt),
  read: notification.read,
  // Surface free-text payload (e.g. the comment body) as the secondary line.
  body: notification.message ?? undefined,
  target: notification.target,
});

function resolveKind(raw: string): NotifKind {
  return KNOWN_KINDS.has(raw as NotifKind) ? (raw as NotifKind) : 'generic';
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
