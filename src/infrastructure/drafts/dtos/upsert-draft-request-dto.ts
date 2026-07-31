import type { ChatMessage } from '@domain/drafts/chat-message';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';

// Body of `PUT /recipes/drafts/:id`. The id travels in the path, so it is the
// one field of `UpsertDraftInput` that does NOT appear here — which is exactly
// why the body deserves a name instead of being spelled out at the call site.
export interface UpsertDraftRequestDto {
  prompt: string;
  snapshot: DraftRecipeSnapshot;
  chatHistory: ChatMessage[];
}
