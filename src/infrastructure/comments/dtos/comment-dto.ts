export interface CommentDto {
  id: string;
  body: string;
  moderationStatus: string;
  recipeId: string;
  authorId: string;
  authorDisplayName: string;
  authorPhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  // Optional: older backend responses may omit like data; the mapper defaults
  // these to 0 / false.
  likeCount?: number;
  likedByMe?: boolean;
}
