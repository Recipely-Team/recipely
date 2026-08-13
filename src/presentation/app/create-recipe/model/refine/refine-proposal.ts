import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import type { RecipeChange } from '@presentation/app/create-recipe/model/refine/recipe-change';

/**
 * A refinement waiting on the cook's answer: the recipe the assistant would
 * write, and what that would alter.
 *
 * @remarks
 * - **It is held, not saved.** Autosave writes the working recipe, and a
 *   proposal is not that recipe until it is accepted — persisting it would put
 *   a change into the draft that the cook may be about to decline.
 * - **`changes` may be empty** when the model returns the recipe it was given.
 *   That is an answer, not a failure, and the card says so rather than
 *   offering an accept that would do nothing.
 */
export interface RefineProposal {
  readonly recipe: EditableRecipe;
  readonly changes: readonly RecipeChange[];
  readonly reply: string;
}
