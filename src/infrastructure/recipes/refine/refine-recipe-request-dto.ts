import type { ChatMessage } from '@domain/drafts/chat-message';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';

// Body of `POST /recipes/refine`: the recipe as it stands, the change the user
// asked for in the chat, and the turns leading up to it. Sends the working
// snapshot rather than an id — the recipe being refined is a preview and may
// never have been persisted. `history` is what lets a follow-up ("and make it
// spicier too") resolve against the earlier turn instead of starting over; the
// backend replays only the most recent few.
export interface RefineRecipeRequestDto {
  currentRecipe: DraftRecipeSnapshot;
  instruction: string;
  history: readonly ChatMessage[];
}
