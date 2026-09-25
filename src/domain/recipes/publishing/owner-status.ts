/**
 * The four states the owner of a recipe sees it in.
 *
 * Derived from `isPublished` and the moderation status (see `toOwnerStatus`),
 * never stored: the two wire fields are the truth, and this is how they read
 * to the person who owns the recipe.
 */
export const OwnerStatus = {
  /** Saved, seen by nobody else. */
  Private: 'private',
  /** Offered for publishing, waiting on the moderator. */
  InReview: 'inReview',
  /** In the feed for everyone. */
  Published: 'published',
  /** The moderator said no; the recipe stays private for good. */
  Rejected: 'rejected',
} as const;

export type OwnerStatusType = (typeof OwnerStatus)[keyof typeof OwnerStatus];
