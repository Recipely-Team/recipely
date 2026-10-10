import { CharConstants, RadixConstants, ValueConstants } from '@core/constants';
import { IngredientList } from '@domain/recipes/ingredients/ingredient-list';
import { UnitSystem } from '@domain/recipes/ingredients/unit-system';
import type { ShoppingItemDraft } from '@domain/shopping/items/shopping-item-draft';
import { shoppingDraftOf } from '@domain/shopping/recipe/shopping-draft-of';
import { ShoppingLimits } from '@domain/shopping/shopping-limits';
import type { PlannedRecipeIngredients } from '@domain/meal-plan/shopping/planned-recipe-ingredients';
import type { PlanShoppingLine } from '@domain/meal-plan/shopping/plan-shopping-line';
import { GroceryAisle, type GroceryAisleType } from '@domain/meal-plan/shopping/grocery-aisle';
import { classifyGrocery } from '@domain/meal-plan/shopping/classify-grocery';
import { groceryKey } from '@domain/meal-plan/shopping/grocery-key';

interface Building {
  key: string;
  label: string;
  drafts: ShoppingItemDraft[];
  aisle: GroceryAisleType;
  isStaple: boolean;
  sources: string[];
  recipeIds: Set<string>;
}

const SCALE = RadixConstants.decimal ** ShoppingLimits.quantityPlaces;
const AISLE_ORDER: readonly GroceryAisleType[] = Object.values(GroceryAisle);

const factorOf = (recipe: PlannedRecipeIngredients): number =>
  recipe.recipeServings > ValueConstants.zero ? recipe.plannedServings / recipe.recipeServings : ValueConstants.one;

const sameUnit = (a: ShoppingItemDraft, b: ShoppingItemDraft): boolean => groceryKey(a.unit ?? CharConstants.empty) === groceryKey(b.unit ?? CharConstants.empty);

/** Two amounts of one unit: summed; an unknown amount ("some salt") never erases a known one. */
const summed = (a: number | null, b: number | null): number | null =>
  a === null ? b : b === null ? a : Math.round((a + b) * SCALE) / SCALE;

const addDraft = (line: Building, draft: ShoppingItemDraft): void => {
  const index = line.drafts.findIndex((held) => sameUnit(held, draft));
  const held = line.drafts[index];
  if (held === undefined) line.drafts.push(draft);
  else line.drafts[index] = { ...held, quantity: summed(held.quantity, draft.quantity) };
};

/** A line shared by several recipes names none of them on the shopping list. */
const finished = ({ key, label, drafts, aisle, isStaple, sources, recipeIds }: Building): PlanShoppingLine => ({
  key,
  label,
  aisle,
  isStaple,
  sources,
  drafts: recipeIds.size > ValueConstants.one ? drafts.map((draft) => ({ ...draft, recipeId: null, recipeName: null })) : drafts,
});

/**
 * **A week's planned recipes → one shopping list**, grouped by aisle.
 *
 * @remarks
 * - **Scaled the way the recipe page scales**: every recipe's lines go through
 *   `IngredientList.present` by `plannedServings / recipeServings`, then are
 *   read into label, amount and unit by `shoppingDraftOf` — the same path
 *   "Add to shopping list" on a recipe takes. Headings and blanks drop out there.
 * - **Merged by name** (`groceryKey`): amounts of one unit are summed,
 *   different units kept side by side.
 * - **Water is left out**; staples are kept but flagged (`classifyGrocery`).
 * - **Ordered by aisle, then by the order the plan first named them.**
 */
export const mergePlanIngredients = (recipes: readonly PlannedRecipeIngredients[]): PlanShoppingLine[] => {
  const lines = new Map<string, Building>();
  for (const recipe of recipes) {
    const scaled = IngredientList.of(recipe.ingredients).present(factorOf(recipe), UnitSystem.Original);
    for (const text of scaled) {
      const draft = shoppingDraftOf(text, { id: recipe.recipeId, name: recipe.recipeName });
      if (draft === null) continue;
      const kind = classifyGrocery(draft.label);
      if (kind.isSkipped) continue;
      const key = groceryKey(draft.label);
      const line = lines.get(key) ?? { key, label: draft.label, drafts: [], aisle: kind.aisle, isStaple: kind.isStaple, sources: [], recipeIds: new Set<string>() };
      addDraft(line, draft);
      if (!line.sources.includes(recipe.recipeName)) line.sources.push(recipe.recipeName);
      line.recipeIds.add(recipe.recipeId);
      lines.set(key, line);
    }
  }
  const ordered = [...lines.values()].map(finished);
  return ordered.sort((a, b) => AISLE_ORDER.indexOf(a.aisle) - AISLE_ORDER.indexOf(b.aisle));
};
