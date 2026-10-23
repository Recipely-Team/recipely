import type { DeleteRecipeIdle } from '@application/recipes/delete/states/delete-recipe-idle';
import type { DeletingRecipe } from '@application/recipes/delete/states/deleting-recipe';
import type { RecipeDeleted } from '@application/recipes/delete/states/recipe-deleted';
import type { DeleteRecipeError } from '@application/recipes/delete/states/delete-recipe-error';

export type DeleteRecipeState =
  | DeleteRecipeIdle
  | DeletingRecipe
  | RecipeDeleted
  | DeleteRecipeError;
