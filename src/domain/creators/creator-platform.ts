/**
 * The accounts a creator can claim. Mirrors `recipely-backend`'s
 * `CreatorPlatform` wire values (docs/creator-tag-contract.md).
 *
 * @remarks
 * - **Not `SourcePlatform`.** That one says where an imported recipe came from
 *   and speaks the import pipeline's upper-case values; this one names an
 *   account a person owns. They share two names, not a meaning.
 * - **Declaration order is picker order.** A platform picker lists
 *   `Object.values(CreatorPlatform)`.
 */
export const CreatorPlatform = {
  Instagram: 'instagram',
  TikTok: 'tiktok',
} as const;

export type CreatorPlatformType = (typeof CreatorPlatform)[keyof typeof CreatorPlatform];
