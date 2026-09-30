import type { CreatorTag } from '@domain/creators/creator-tag';

export interface UserProfileEntityProps {
  id: string;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  recipeCount: number;
  totalLikes: number;
  totalViews: number;
  joinedAt: Date;
  /** The approved creator tag; `null` for everyone else, and while a claim is under review. */
  creator: CreatorTag | null;
}
