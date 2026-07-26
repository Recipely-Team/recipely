import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import type { CreateRecipeProgressCallback } from '@domain/recipes/create/create-recipe-progress-callback';
import type { UpdateRecipeInput } from '@domain/recipes/update/update-recipe-input';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import type { RefinedRecipe } from '@domain/recipes/refine/refined-recipe';
import type { CreateRecipeState } from '@application/recipes/create/create-recipe-state';
import type { GenerateRecipeState } from '@application/recipes/generate/generate-recipe-state';
import type { UpdateRecipeState } from '@application/recipes/update/update-recipe-state';
import type { DeleteRecipeState } from '@application/recipes/delete/delete-recipe-state';
import type { RefineRecipeState } from '@application/recipes/refine/refine-recipe-state';

export interface CreatedRecipesStoreState {
  // WHY: `recipes` and `localRecipes` split the two jobs this used to do as
  // one `Recipe[]` field. `recipes` is the lean list for the "My Recipes"
  // grid, populated by `loadMyRecipes` (backend now returns RecipeSummaryEntity for
  // /me/recipes). `localRecipes` is the full-detail override cache read by
  // `findById` (detail/edit screens fall back to a network fetch when an id
  // isn't present here) and is kept fresh by create/update/delete.
  recipes: readonly RecipeSummaryEntity[];
  localRecipes: readonly RecipeEntity[];
  createState: CreateRecipeState;
  generateState: GenerateRecipeState;
  // WHY: reuses GenerateRecipeState — the import flow has the identical
  // idle/generating/success/error shape (it produces the same preview Recipe),
  // so a near-duplicate state union would only drift over time.
  importState: GenerateRecipeState;
  updateState: UpdateRecipeState;
  deleteState: DeleteRecipeState;
  refineState: RefineRecipeState;
  aiDraft: RecipeEntity | null;
  add: (recipe: RecipeEntity) => void;
  remove: (id: string) => void;
  replace: (recipe: RecipeEntity) => void;
  findById: (id: string) => RecipeEntity | undefined;
  createRecipe: (input: CreateRecipeInput, onProgress?: CreateRecipeProgressCallback) => Promise<void>;
  loadMyRecipes: () => Promise<void>;
  generateRecipe: (prompt: string) => Promise<void>;
  importInstagram: (url: string) => Promise<void>;
  refineRecipe: (
    currentRecipe: DraftRecipeSnapshot,
    instruction: string,
  ) => Promise<RefinedRecipe | null>;
  updateRecipe: (id: string, input: UpdateRecipeInput, onProgress?: CreateRecipeProgressCallback) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  resetCreateState: () => void;
  resetGenerateState: () => void;
  resetImportState: () => void;
  resetRefineState: () => void;
  resetUpdateState: () => void;
  resetDeleteState: () => void;
  clearAiDraft: () => void;
  /** Drops the signed-in user's recipe lists and AI draft. Called when the session ends. */
  clear: () => void;
}
