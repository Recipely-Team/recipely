import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import type { ChatMessage } from '@domain/drafts/chat-message';

// Wire shape returned by the Recipely backend for a single recipe draft.
// Keep in sync with recipely-backend `application/drafts/dtos/draft.dto.ts`.
export interface RecipeDraftDto {
  id: string;
  ownerId: string;
  prompt: string;
  snapshot: DraftRecipeSnapshot;
  chatHistory: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
