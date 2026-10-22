import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import type { CreateRecipeProgressCallback } from '@domain/recipes/create/create-recipe-progress-callback';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import type { RefinedRecipe } from '@domain/recipes/refine/refined-recipe';
import type { CreateRecipeState } from '@application/recipes/create/create-recipe-state';
import type { GenerateRecipeState } from '@application/recipes/generate/generate-recipe-state';
import type { DeleteRecipeState } from '@application/recipes/delete/delete-recipe-state';
import type { RefineRecipeState } from '@application/recipes/refine/refine-recipe-state';
import type { MyRecipesListState } from '@application/recipes/my-recipes/my-recipes-list-state';
import type { ChatMessage } from '@domain/drafts/chat-message';
import type { ListPaging } from '@application/store/paging/list-paging/list-paging';

export interface CreatedRecipesStore {
  // recipes: the lean My Recipes grid; localRecipes: full entities for findById.
  recipes: readonly RecipeSummaryEntity[];
  /** Load status of `recipes` — what the My-Recipes grid shows a skeleton for. */
  myRecipesState: MyRecipesListState;
  /** The server's total of the user's recipes and whether more pages exist; the Created tab count reads `total`. */
  myRecipesPaging: ListPaging;
  localRecipes: readonly RecipeEntity[];
  createState: CreateRecipeState;
  generateState: GenerateRecipeState;
  deleteState: DeleteRecipeState;
  refineState: RefineRecipeState;
  add: (recipe: RecipeEntity) => void;
  remove: (id: string) => void;
  findById: (id: string) => RecipeEntity | undefined;
  createRecipe: (input: CreateRecipeInput, onProgress?: CreateRecipeProgressCallback) => Promise<void>;
  loadMyRecipes: () => Promise<void>;
  /** The next page of the user's recipes, appended; a no-op once the total is reached. */
  loadMoreMyRecipes: () => Promise<void>;
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
  /** Drops the signed-in user's recipe lists. Called when the session ends. */
  clear: () => void;
}
