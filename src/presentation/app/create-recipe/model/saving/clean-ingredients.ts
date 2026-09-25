import { ValueConstants } from '@core/constants';
import { isIngredientGroup } from '@domain/recipes/ingredients/is-ingredient-group';
import { ingredientGroupLabel } from '@domain/recipes/ingredients/ingredient-group-label';
import { cleanLines } from '@presentation/app/create-recipe/model/saving/clean-lines';

/**
 * Drops group headings the user never named. The editor creates the marker the
 * moment "add a group" is tapped, so an abandoned one would otherwise save as a
 * blank heading above the ingredients that follow it.
 */
export const cleanIngredients = (lines: readonly string[]): string[] =>
  cleanLines(lines).filter(
    (line) => !isIngredientGroup(line) || ingredientGroupLabel(line).length > ValueConstants.zero,
  );
