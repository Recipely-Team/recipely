import { guessedLinesOf } from '@domain/drafts/guessed-lines-of';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';

/**
 * Imports mangled lines and nothing said which ones were guesses. The draft
 * now marks the lines the model filled in rather than read, by their text, so
 * editing a line is what clears its mark.
 */
const draft = (over: Partial<DraftRecipeSnapshot>): DraftRecipeSnapshot => ({
  ingredients: ['3 eggs', '2 tomatoes', 'salt'],
  instructions: ['Chop.', 'Cook 5 minutes.'],
  ...over,
});

describe('guessedLinesOf', () => {
  it('names the guessed lines of a fresh import by their text', () => {
    const set = guessedLinesOf(draft({ importReading: { suggested: false, guessedIngredients: [1], guessedSteps: [1] } }));
    expect([...set]).toEqual(['2 tomatoes', 'Cook 5 minutes.']);
  });

  it('uses the saved list on a resumed draft, not the original indexes', () => {
    const set = guessedLinesOf(draft({ importReading: { suggested: false, guessedIngredients: [0, 1], guessedSteps: [] }, guessedLines: ['2 tomatoes'] }));
    expect([...set]).toEqual(['2 tomatoes']);
  });

  it('marks nothing on a suggested recipe whose every line was written: the note says so', () => {
    const set = guessedLinesOf(draft({ importReading: { suggested: true, guessedIngredients: [0, 1, 2], guessedSteps: [0, 1] } }));
    expect(set.size).toBe(0);
  });

  it('marks nothing on a draft that is not an import', () => {
    expect(guessedLinesOf(draft({})).size).toBe(0);
  });
});
