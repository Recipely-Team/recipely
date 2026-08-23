import { recipeRoster } from '@presentation/base/hooks/assistant/args/recipe-roster';

/**
 * The screen line used to be a route and nothing else. "Open the second one"
 * and "save the chicken one" were phrases handed blindly to a handler to
 * resolve, and "is there anything here?" had no answer at all — the model was
 * told the user was on `/recipes` and left to guess what that meant.
 */
describe('recipeRoster', () => {
  it('numbers the rows the way a person refers to them', () => {
    expect(recipeRoster('recipes', ['Baklava', 'Mercimek çorbası'])).toBe(
      'recipes=1) Baklava 2) Mercimek çorbası',
    );
  });

  it('says an empty list is empty, rather than saying nothing', () => {
    // The difference between "there are no recipes here" and a line the model
    // reads as "no information", which it answers by guessing.
    expect(recipeRoster('recipes', [])).toBe('recipes=none');
  });

  it('counts the rows past the fold instead of naming them', () => {
    const names = Array.from({ length: 20 }, (_, at) => `Recipe ${at + 1}`);

    const line = recipeRoster('recipes', names);

    expect(line).toContain('8) Recipe 8');
    expect(line).not.toContain('9) Recipe 9');
    expect(line).toContain('(+12 more)');
  });

  it('does not claim there are more when the list ends exactly at the cap', () => {
    const names = Array.from({ length: 8 }, (_, at) => `Recipe ${at + 1}`);

    expect(recipeRoster('recipes', names)).not.toContain('more');
  });
});
