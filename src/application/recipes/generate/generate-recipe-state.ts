import type { Failure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

export type GenerateRecipeState =
  | { status: 'idle' }
  | { status: 'generating' }
  | { status: 'success'; recipe: RecipeEntity }
  | { status: 'error'; failure: Failure };
