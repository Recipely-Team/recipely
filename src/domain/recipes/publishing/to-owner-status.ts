import { ModerationStatus } from '@domain/recipes/publishing/moderation-status';
import { OwnerStatus, type OwnerStatusType } from '@domain/recipes/publishing/owner-status';

/**
 * How a recipe reads to its owner.
 *
 * @remarks
 * - **Rejected wins.** A rejected recipe is private, but "private" would offer
 *   a Publish the backend refuses.
 * - **Published needs both halves.** `isPublished` with a pending review is
 *   still in review — the feed does not show it yet.
 * - **Anything else is private**, including a status this build has no word
 *   for: the safe reading of an unknown state is that nobody else can see it.
 */
export const toOwnerStatus = (isPublished: boolean, moderationStatus: string): OwnerStatusType => {
  if (moderationStatus === ModerationStatus.Rejected) return OwnerStatus.Rejected;
  if (moderationStatus === ModerationStatus.Pending) return OwnerStatus.InReview;
  if (isPublished && moderationStatus === ModerationStatus.Approved) return OwnerStatus.Published;
  return OwnerStatus.Private;
};
