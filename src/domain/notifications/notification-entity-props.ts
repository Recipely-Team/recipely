export interface NotificationEntityProps {
  id: string;
  type: string;
  senderId: string | null;
  senderDisplayName: string | null;
  senderPhotoUrl: string | null;
  recipeId: string | null;
  recipeTitle: string | null;
  commentId: string | null;
  /** The draft an import-completed notification opens. Null for every other type. */
  draftId: string | null;
  message: string | null;
  read: boolean;
  createdAt: Date;
}
