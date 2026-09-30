import type { CreatorTagDto } from '@infrastructure/creators/dtos/creator-tag-dto';

// One item of `GET /users/creators` (docs/creator-tag-contract.md).
export interface CreatorSummaryDto {
  id: string;
  displayName: string;
  photoUrl: string | null;
  creator: CreatorTagDto;
  /** Published and approved recipes. */
  recipeCount: number;
  followerCount: number;
}
