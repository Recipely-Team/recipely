import { IngredientList } from '@domain/recipes/ingredients/ingredient-list';

/**
 * The ingredient lines as the assistant reads them, index for index with the
 * screen's: a group heading reads as its label ("For the sauce"), never "# For the sauce".
 */
export const spokenIngredientLines = (lines: readonly string[]): string[] =>
  IngredientList.of(lines).lines.map((line) => (line.isGroup ? line.groupLabel : line.raw));
