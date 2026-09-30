import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

/** The three lists the Recipes tab draws from, as the stores hold them. */
export interface RecipeFoodSources {
  mine: readonly RecipeSummaryEntity[];
  saved: readonly RecipeSummaryEntity[];
  feed: readonly RecipeSummaryEntity[];
}
