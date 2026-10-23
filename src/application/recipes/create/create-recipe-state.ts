import type { CreateRecipeIdle } from '@application/recipes/create/states/create-recipe-idle';
import type { CreatingRecipe } from '@application/recipes/create/states/creating-recipe';
import type { RecipeCreated } from '@application/recipes/create/states/recipe-created';
import type { CreateRecipeError } from '@application/recipes/create/states/create-recipe-error';

export type CreateRecipeState =
  | CreateRecipeIdle
  | CreatingRecipe
  | RecipeCreated
  | CreateRecipeError;
