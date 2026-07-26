// Wire shapes returned by the Recipely backend for notification endpoints.
// Keep in sync with recipely-backend `i-notification-repository.ts`.

export interface NotificationItemDto {
  id: string;
  type: string;
  senderId: string | null;
  senderDisplayName: string | null;
  senderPhotoUrl: string | null;
  recipeId: string | null;
  recipeTitle: string | null;
  /**
   * Optional because the app ships independently of the backend: a server that
   * predates the comment-deep-link work omits the field entirely. The mapper
   * degrades a missing value to null, which downgrades the notification to a
   * plain recipe link rather than breaking it.
   */
  commentId?: string | null;
  message: string | null;
  read: boolean;
  createdAt: string;
}
