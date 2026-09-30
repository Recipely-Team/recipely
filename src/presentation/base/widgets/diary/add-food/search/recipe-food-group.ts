import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

/** One heading of the Recipes tab — My recipes, Saved or From Recipely — and its rows. */
export interface RecipeFoodGroup {
  key: string;
  title: string;
  recipes: readonly RecipeSummaryEntity[];
}
