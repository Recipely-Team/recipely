import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';

/** Whether any ingredient or step on screen is still an unedited guessed line: the legend shows only then. */
export const hasGuessedLine = (recipe: EditableRecipe, guessed: ReadonlySet<string>): boolean =>
  guessed.size > 0 && [...recipe.ingredients, ...recipe.instructions].some((line) => guessed.has(line.trim()));
