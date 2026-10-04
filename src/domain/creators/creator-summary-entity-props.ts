import type { CreatorTag } from '@domain/creators/creator-tag';

export interface CreatorSummaryEntityProps {
  /** The creator's user id — what the profile route opens. */
  id: string;
  displayName: string;
  photoUrl: string | null;
  /** Always an approved tag: the list only carries approved creators. */
  /** Approved accounts, one per platform, Instagram first; never empty. */
  creatorTags: readonly CreatorTag[];
  /** Published and approved recipes. */
  recipeCount: number;
  followerCount: number;
}
