/**
 * The notification types about the user's own creator claims — one per
 * platform decision. Their `sourcePlatform` is a lower-case creator platform
 * (`instagram` / `tiktok`), unlike an import's upper-case source platform, so
 * a reader switches on the type first.
 */
export const CreatorNotificationType = {
  Approved: 'creator_approved',
  Rejected: 'creator_rejected',
} as const;

export type CreatorNotificationTypeType = (typeof CreatorNotificationType)[keyof typeof CreatorNotificationType];
