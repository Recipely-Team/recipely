import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import { ValueConstants } from '@core/constants';

const linesAt = (lines: readonly string[] | undefined, indexes: readonly number[]): string[] =>
  indexes.map((i) => lines?.[i]?.trim()).filter((line): line is string => line !== undefined && line.length > ValueConstants.zero);

/**
 * The ingredient and step lines of an imported draft that the model guessed
 * rather than read, by their text — a line keeps its "Check" chip only while
 * its text is unchanged, so editing it is what clears it.
 *
 * @remarks
 * - **A resumed draft uses what was saved** (`guessedLines`): the indexes the
 *   import sent point into the lines as they first arrived, not as edited.
 * - **A suggested recipe whose every line was guessed has no chips.** The note
 *   on top already says the whole recipe was written; a chip on every line is
 *   noise (the prototype's rule).
 */
export const guessedLinesOf = (snapshot: DraftRecipeSnapshot): ReadonlySet<string> => {
  if (snapshot.guessedLines !== undefined) return new Set(snapshot.guessedLines);
  const reading = snapshot.importReading;
  if (reading === undefined) return new Set();
  const ingredients = snapshot.ingredients ?? [];
  const steps = snapshot.instructions ?? [];
  const everyLine =
    reading.guessedIngredients.length >= ingredients.length && reading.guessedSteps.length >= steps.length;
  if (reading.suggested && everyLine) return new Set();
  return new Set([...linesAt(ingredients, reading.guessedIngredients), ...linesAt(steps, reading.guessedSteps)]);
};
