import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

export type TrendingRecipesState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; recipes: RecipeSummaryEntity[] }
  | { status: 'error'; failure: Failure };
