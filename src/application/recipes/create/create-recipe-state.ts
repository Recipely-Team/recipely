import type { Failure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

export type CreateRecipeState =
  | { status: 'idle' }
  | { status: 'creating' }
  | { status: 'success'; recipe: RecipeEntity }
  | { status: 'error'; failure: Failure };
