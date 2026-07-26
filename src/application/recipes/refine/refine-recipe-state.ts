import type { Failure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

export type RefineRecipeState =
  | { status: 'idle' }
  | { status: 'refining' }
  | { status: 'success'; recipe: RecipeEntity }
  | { status: 'error'; failure: Failure };
