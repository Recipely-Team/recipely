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
  // Optional: older responses omit like data.
  likeCount?: number;
  likedByMe?: boolean;
}
