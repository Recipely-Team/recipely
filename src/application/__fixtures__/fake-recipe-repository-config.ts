import type { Failure } from '@core/failure';
import type { Result } from '@core/result/result';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RefinedRecipe } from '@domain/recipes/refine/refined-recipe';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

export interface FakeRecipeRepositoryConfig {
  listActiveRecipesResult?: Result<RecipeSummaryEntity[], Failure>;
  listTrendingRecipesResult?: Result<RecipeSummaryEntity[], Failure>;
  listMyRecipesResult?: Result<RecipeSummaryEntity[], Failure>;
  getRecipeResult?: Result<RecipeEntity, Failure>;
  createRecipeResult?: Result<RecipeEntity, Failure>;
  generateRecipeResult?: Result<RecipeEntity, Failure>;
  importInstagramRecipeResult?: Result<RecipeEntity, Failure>;
  refineRecipeResult?: Result<RefinedRecipe, Failure>;
  updateRecipeResult?: Result<RecipeEntity, Failure>;
  deleteRecipeResult?: Result<void, Failure>;
}
