import { toRecipeOrigin } from '@domain/recipes/provenance/to-recipe-origin';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';

describe('toRecipeOrigin', () => {
  it.each([
    ['USER', RecipeOrigin.User],
    ['AI', RecipeOrigin.Ai],
    ['IMPORT', RecipeOrigin.Import],
    ['CURATED', RecipeOrigin.Curated],
  ])('reads %p', (raw, origin) => {
    expect(toRecipeOrigin(raw)).toBe(origin);
  });

  it.each([undefined, '', 'SCRAPED', 'curated'])('reads %p as a person wrote it', (raw) => {
    expect(toRecipeOrigin(raw)).toBe(RecipeOrigin.User);
  });
});
