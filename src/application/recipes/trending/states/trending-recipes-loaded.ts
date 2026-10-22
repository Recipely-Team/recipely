import type { StoreStatus } from '@application/store/store-status';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

export interface TrendingRecipesLoaded {
  status: typeof StoreStatus.Loaded;
  recipes: RecipeSummaryEntity[];
}
