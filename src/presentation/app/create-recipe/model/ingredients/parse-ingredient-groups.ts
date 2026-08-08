import { isIngredientGroup } from '@domain/recipes/ingredients/is-ingredient-group';
import { ingredientGroupLabel } from '@domain/recipes/ingredients/ingredient-group-label';
import type { IngredientGroup } from '@presentation/app/create-recipe/model/ingredients/ingredient-group';
import { ValueConstants } from '@core/constants';

/** The ungrouped run has no heading line to point at. */
const NO_HEADER = ValueConstants.minusOne;

/**
 * Reads the stored flat array as the groups the editor draws.
 *
 * @remarks
 * - **The storage shape does not change.** Ingredients stay a `string[]` with
 *   `# Label` headings inside it, so AI output, drafts, publishing and every
 *   read-only view keep working untouched. This is a lens over that array, and
 *   every item carries its `index` so edits write straight back to it.
 * - **Ungrouped is a first-class group, not a leftover.** Most recipes have no
 *   headings at all, so the run before the first heading is returned as a group
 *   with `label: null` — the editor renders it without card chrome. It is
 *   dropped only when it is empty AND there are real groups, so a recipe that
 *   opens with a heading does not show a stray empty shell above it.
 */
export const parseIngredientGroups = (ingredients: readonly string[]): IngredientGroup[] => {
  const groups: IngredientGroup[] = [{ label: null, headerIndex: NO_HEADER, items: [] }];

  ingredients.forEach((value, index) => {
    if (isIngredientGroup(value)) {
      groups.push({ label: ingredientGroupLabel(value), headerIndex: index, items: [] });
      return;
    }
    groups[groups.length - ValueConstants.one]?.items.push({ value, index });
  });

  const [first] = groups;
  if (groups.length > ValueConstants.one && first?.items.length === ValueConstants.zero) {
    groups.shift();
  }
  return groups;
};
