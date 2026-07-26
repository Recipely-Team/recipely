import type { Failure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

export type UpdateRecipeState =
  | { status: 'idle' }
  | { status: 'updating' }
  | { status: 'success'; recipe: RecipeEntity }
  | { status: 'error'; failure: Failure };
