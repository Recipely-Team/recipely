import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';

// Body of `POST /recipes/refine`: the recipe as it stands plus the change the
// user asked for in the chat. Sends the working snapshot rather than an id —
// the recipe being refined is a preview and may never have been persisted.
export interface RefineRecipeRequestDto {
  currentRecipe: DraftRecipeSnapshot;
  instruction: string;
}
