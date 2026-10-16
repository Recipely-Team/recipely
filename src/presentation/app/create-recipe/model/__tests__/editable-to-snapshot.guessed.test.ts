import { editableToSnapshot } from '@presentation/app/create-recipe/model/drafting/editable-to-snapshot';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/empty-editable';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';

/** An edited guessed line loses its chip, and the draft remembers that across a resume. */
const loaded: DraftRecipeSnapshot = {
  ingredients: ['3 eggs', '2 tomatoes'],
  instructions: ['Cook.'],
  importReading: { suggested: false, guessedIngredients: [1], guessedSteps: [0] },
};

describe('editableToSnapshot — guessed lines', () => {
  it('saves only the guessed lines the user has not edited', () => {
    const recipe = { ...emptyEditable(), ingredients: ['3 eggs', '2 ripe tomatoes'], instructions: ['Cook.'] };
    expect(editableToSnapshot(recipe, loaded).guessedLines).toEqual(['Cook.']);
  });

  it('writes no guessedLines for a draft that is not an import', () => {
    const recipe = { ...emptyEditable(), ingredients: ['3 eggs'] };
    expect(editableToSnapshot(recipe, { ingredients: ['3 eggs'] }).guessedLines).toBeUndefined();
  });
});
