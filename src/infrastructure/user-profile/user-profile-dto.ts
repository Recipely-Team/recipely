import type { CreatorTagDto } from '@infrastructure/creators/dtos/creator-tag-dto';

// Wire shape returned by the Recipely backend `GET /api/v1/users/:id`.
// Keep in sync with recipely-backend user profile response.

export interface UserProfileDto {
  id: string;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  recipeCount: number;
  totalLikes: number;
  totalViews: number;
  /**
   * Follow fields. Optional because the entity mapper does not need them; the
   * creator page reads `followerCount` and `isFollowedByMe` into a
   * `ViewedUserProfile` (missing reads as 0 / not following).
   */
  followerCount?: number;
  followingCount?: number;
  isFollowedByMe?: boolean;
  joinedAt: string;
  /**
   * The approved creator tag, `null` otherwise. Optional because a backend
   * older than creator tags does not send it; that reads as `null`.
   */
  creator?: CreatorTagDto | null;
}
