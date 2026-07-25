import type { ChatMessage } from '@domain/drafts/chat-message';
import type { UpsertDraftStoreInput } from '@application/drafts/write/upsert-draft-store-input';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';

export interface UseDraftAutosaveArgs {
  enabled: boolean;
  draftId: string;
  prompt: string;
  recipe: EditableRecipe;
  chatHistory: ChatMessage[];
  upsertDraft: (input: UpsertDraftStoreInput) => Promise<unknown>;
}
