import type { CreateRecipeUseCase } from '@application/recipes/create/create-recipe-use-case';
import type { ListMyRecipesUseCase } from '@application/recipes/my-recipes/list-my-recipes-use-case';
import type { GenerateRecipeUseCase } from '@application/recipes/generate/generate-recipe-use-case';
import type { ImportInstagramRecipeUseCase } from '@application/recipes/import/import-instagram-recipe-use-case';
import type { RefineRecipeUseCase } from '@application/recipes/refine/refine-recipe-use-case';
import type { DeleteRecipeUseCase } from '@application/recipes/delete/delete-recipe-use-case';
import type { RecipeListStore } from '@application/recipes/list/recipe-list-store';
import type { RecipeDetailStore } from '@application/recipes/detail/recipe-detail-store';

export interface CreatedRecipesStoreDeps {
  createRecipeUseCase: CreateRecipeUseCase;
  listMyRecipesUseCase: ListMyRecipesUseCase;
  generateRecipeUseCase: GenerateRecipeUseCase;
  importInstagramRecipeUseCase: ImportInstagramRecipeUseCase;
  refineRecipeUseCase: RefineRecipeUseCase;
  deleteRecipeUseCase: DeleteRecipeUseCase;
  // WHY: owner-mutation flows must keep the public feed and detail cache in
  // sync. Without this, the recipe list at /recipes and the detail page show
  // stale data after a delete until the next full reload.
  recipeListStore: RecipeListStore;
  recipeDetailStore: RecipeDetailStore;
}
