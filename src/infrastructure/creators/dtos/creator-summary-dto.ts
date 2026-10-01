import type { CreatorTagDto } from '@infrastructure/creators/dtos/creator-tag-dto';

// One item of `GET /users/creators` (docs/creator-tag-contract.md).
export interface CreatorSummaryDto {
  id: string;
  displayName: string;
  photoUrl: string | null;
  /** Approved tags, Instagram first; never empty. */
  creatorTags: CreatorTagDto[];
  /** Published and approved recipes. */
  recipeCount: number;
  followerCount: number;
}
