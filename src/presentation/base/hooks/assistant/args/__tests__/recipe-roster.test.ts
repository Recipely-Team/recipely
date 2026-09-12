import { ListState } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { recipeRoster } from '@presentation/base/hooks/assistant/args/describing/recipe-roster';

/**
 * The screen line used to be a route and nothing else. "Open the second one"
 * and "save the chicken one" were phrases handed blindly to a handler to
 * resolve, and "is there anything here?" had no answer at all — the model was
 * told the user was on `/recipes` and left to guess what that meant.
 */
describe('recipeRoster', () => {
  it('numbers the rows the way a person refers to them', () => {
    expect(recipeRoster('recipes', ['Baklava', 'Mercimek çorbası'], ListState.Ready)).toBe(
      'recipes=1) Baklava 2) Mercimek çorbası',
    );
  });

  it('says an empty list is empty, rather than saying nothing', () => {
    // The difference between "there are no recipes here" and a line the model
    // reads as "no information", which it answers by guessing.
    expect(recipeRoster('recipes', [], ListState.Ready)).toBe('recipes=none');
  });

  it('counts the rows past the fold instead of naming them', () => {
    const names = Array.from({ length: 20 }, (_, at) => `Recipe ${at + 1}`);

    const line = recipeRoster('recipes', names, ListState.Ready);

    expect(line).toContain('8) Recipe 8');
    expect(line).not.toContain('9) Recipe 9');
    expect(line).toContain('(+12 more)');
  });

  it('does not claim there are more when the list ends exactly at the cap', () => {
    const names = Array.from({ length: 8 }, (_, at) => `Recipe ${at + 1}`);

    expect(recipeRoster('recipes', names, ListState.Ready)).not.toContain('more');
  });
});

/**
 * Reported: "oluşturduğum tarifleri aç dedim, yok dedi — ama o arada tarifler
 * yükleniyordu." A count of nothing is a fact to a model, and it says it out
 * loud as "you have none". A screen that does not know yet must say so.
 */
describe('a list that has not arrived', () => {
  it('says it is loading rather than that there is nothing', () => {
    expect(recipeRoster('created', [], ListState.Loading)).toBe('created=loading');
  });

  it('says nothing is there once the list has arrived empty', () => {
    expect(recipeRoster('created', [], ListState.Ready)).toBe('created=none');
  });

  it('reads the rows it has, loaded or not', () => {
    expect(recipeRoster('created', ['Mercimek'], ListState.Loading)).toBe('created=1) Mercimek');
  });

  it('says the load failed rather than that the list is empty', () => {
    expect(recipeRoster('created', [], ListState.Failed)).toBe('created=failed');
  });
});
