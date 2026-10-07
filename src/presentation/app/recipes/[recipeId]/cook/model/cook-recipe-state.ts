import type { Failure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { CookRecipeStatus } from '@presentation/app/recipes/[recipeId]/cook/model/cook-recipe-status';

/**
 * The recipe cook mode is showing: loading, failed, a recipe with no steps to
 * walk through, or one ready to cook.
 */
export type CookRecipeState =
  | { status: typeof CookRecipeStatus.Loading }
  | { status: typeof CookRecipeStatus.Error; failure: Failure }
  | { status: typeof CookRecipeStatus.Empty; recipe: RecipeEntity }
  | { status: typeof CookRecipeStatus.Ready; recipe: RecipeEntity };
