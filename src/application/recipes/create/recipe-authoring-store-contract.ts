import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import type { CreateRecipeProgressCallback } from '@domain/recipes/create/create-recipe-progress-callback';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import type { RefinedRecipe } from '@domain/recipes/refine/refined-recipe';
import type { CreateRecipeState } from '@application/recipes/create/create-recipe-state';
import type { GenerateRecipeState } from '@application/recipes/generate/generate-recipe-state';
import type { DeleteRecipeState } from '@application/recipes/delete/delete-recipe-state';
import type { RefineRecipeState } from '@application/recipes/refine/refine-recipe-state';
import type { ChatMessage } from '@domain/drafts/chat-message';

export interface RecipeAuthoringStore {
  /** Full entities of recipes created on this device, for `findById`; the Created list is `myRecipesStore`. */
  localRecipes: readonly RecipeEntity[];
  createState: CreateRecipeState;
  generateState: GenerateRecipeState;
  deleteState: DeleteRecipeState;
  refineState: RefineRecipeState;
  add: (recipe: RecipeEntity) => void;
  remove: (id: string) => void;
  findById: (id: string) => RecipeEntity | undefined;
  createRecipe: (input: CreateRecipeInput, onProgress?: CreateRecipeProgressCallback) => Promise<void>;
  generateRecipe: (prompt: string) => Promise<void>;
  refineRecipe: (
    currentRecipe: DraftRecipeSnapshot,
    instruction: string,
    history: readonly ChatMessage[],
  ) => Promise<RefinedRecipe | null>;
  deleteRecipe: (id: string) => Promise<void>;
  resetCreateState: () => void;
  resetGenerateState: () => void;
  resetRefineState: () => void;
  resetDeleteState: () => void;
  /** Drops the signed-in user's local recipes and flow states. Called when the session ends. */
  clear: () => void;
}
