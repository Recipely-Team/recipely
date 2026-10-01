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
  /** The approved creator tags, one per platform, Instagram first; empty for everyone else. */
  creatorTags: readonly CreatorTag[];
}
