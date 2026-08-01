export interface CommentEntityProps {
  id: string;
  body: string;
  authorId: string;
  recipeId: string;
  createdAt: Date;
  authorDisplayName: string;
  authorPhotoUrl: string | null;
  likeCount: number;
  likedByMe: boolean;
}
