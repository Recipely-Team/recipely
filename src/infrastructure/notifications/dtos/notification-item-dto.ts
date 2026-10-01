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
  /** Optional for the same reason `commentId` is: a server that predates the
   *  background-import work omits it, and a missing value must degrade to a
   *  notification with no destination rather than break the list. */
  draftId?: string | null;
  message: string | null;
  /**
   * Where an import's recipe came from (upper-case, `INSTAGRAM`), or the
   * creator platform a `creator_approved` / `creator_rejected` is about
   * (lower-case, `instagram`) — read by type. Optional like `draftId`: an older
   * server omits it.
   */
  sourcePlatform?: string | null;
  /** The account or site an import came from, or the claimed handle of a creator decision. */
  sourceHandle?: string | null;
  read: boolean;
  createdAt: string;
}
