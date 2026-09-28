import type { SourcePlatformType } from '@domain/recipes/provenance/source-platform';

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
  /** Where an import notification's recipe came from; null for other types and for rows older than the field. */
  sourcePlatform: SourcePlatformType | null;
  /** The account (or, for a web page, the site) an import came from, when the importer knew it. */
  sourceHandle: string | null;
  read: boolean;
  createdAt: Date;
}
