import type { ChatMessage } from '@domain/drafts/chat-message';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';

export interface RefineRecipeInput {
  currentRecipe: DraftRecipeSnapshot;
  instruction: string;
  /** Turns leading up to this instruction, so a follow-up can lean on them. */
  history: readonly ChatMessage[];
}
