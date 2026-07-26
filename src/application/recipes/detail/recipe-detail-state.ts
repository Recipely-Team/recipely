import type { Failure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

export type RecipeDetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; recipe: RecipeEntity }
  | { status: 'error'; failure: Failure };
