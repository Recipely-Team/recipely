import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

export type TrendingRecipesState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Loaded; recipes: RecipeSummaryEntity[] }
  | { status: typeof StoreStatus.Error; failure: Failure };
