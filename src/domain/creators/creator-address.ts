import type { CreatorTag } from '@domain/creators/creator-tag';
import { CreatorPlatform } from '@domain/creators/creator-platform';

/**
 * The part of a creator's public page address after `/creators/`: their
 * approved Instagram handle (`recipely.net/creators/recipelyapp`), or their
 * user id when they have none.
 *
 * @remarks
 * - **The handle is the address people can say and type.** It is what a
 *   creator puts in their bio and what comment-to-DM links to.
 * - **Only approved tags reach a public profile**, so the handle here is one
 *   Recipely checked; the backend resolves it the same way.
 * - **The id still works** for every link shared before.
 */
export const creatorAddress = (creator: { readonly id: string; readonly creatorTags: readonly CreatorTag[] }): string =>
  creator.creatorTags.find((tag) => tag.platform === CreatorPlatform.Instagram)?.handle ?? creator.id;
