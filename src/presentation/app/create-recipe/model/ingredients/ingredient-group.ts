import type { GroupedIngredient } from '@presentation/app/create-recipe/model/ingredients/grouped-ingredient';

/** A run of ingredients under one heading, or the ungrouped run before the first. */
export interface IngredientGroup {
  /** The heading text, or null for the ungrouped run at the top. */
  label: string | null;
  /** Index of the `# Label` line, or -1 when there is no heading. */
  headerIndex: number;
  items: GroupedIngredient[];
}
