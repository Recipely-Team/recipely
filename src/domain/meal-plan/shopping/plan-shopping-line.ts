import type { ShoppingItemDraft } from '@domain/shopping/items/shopping-item-draft';
import type { GroceryAisleType } from '@domain/meal-plan/shopping/grocery-aisle';

/**
 * One merged ingredient of a planned week — what the shopping confirm lists
 * as one row and what a tick sends to the shopping list.
 *
 * @remarks
 * - **`drafts` hold one amount per unit**: "300 g" and "2 cups" of the same
 *   thing stay two drafts (the list merges by label and unit) and read as
 *   "300 g + 2 cups".
 * - **`sources` are the recipe names** it came from, in plan order.
 */
export interface PlanShoppingLine {
  /** `groceryKey` of the label — stable across reloads, unique in a week. */
  readonly key: string;
  readonly label: string;
  readonly drafts: readonly ShoppingItemDraft[];
  readonly aisle: GroceryAisleType;
  readonly isStaple: boolean;
  readonly sources: readonly string[];
}
