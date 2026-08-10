import { toRecipeListQuery } from '@infrastructure/recipes/to-recipe-list-query';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { Difficulty } from '@domain/recipes/difficulty';

/**
 * The bug this mapper exists to prevent: `GET /recipes` was called with
 * `{ page: 1, pageSize: … }` written into the repository method, so every
 * request in the app's life asked for page one. The feed could never show more
 * than a single page and nothing in the type system objected.
 */

describe('toRecipeListQuery', () => {
  it('asks for the page it was given', () => {
    expect(toRecipeListQuery({ page: 3 }).page).toBe(3);
  });

  it('defaults to the first page when none is named', () => {
    expect(toRecipeListQuery(undefined).page).toBe(1);
    expect(toRecipeListQuery({ search: 'kek' }).page).toBe(1);
  });

  it('always names a page size, so the backend default cannot drift under us', () => {
    expect(toRecipeListQuery(undefined).pageSize).toBeGreaterThan(0);
  });

  it('comma-joins multi-value filters, which is the transport detail', () => {
    const q = toRecipeListQuery({
      cuisines: [CuisineKey.Turkish, CuisineKey.Italian],
      difficulties: [Difficulty.Easy, Difficulty.Hard],
    });

    expect(q.cuisines).toBe(`${CuisineKey.Turkish},${CuisineKey.Italian}`);
    expect(q.difficulties).toBe(`${Difficulty.Easy},${Difficulty.Hard}`);
  });

  it('omits an empty filter rather than sending it blank', () => {
    // `search=` asks the backend to match the empty string; `cuisines=` the
    // same. Absent and empty are different questions.
    const q = toRecipeListQuery({ search: '', cuisines: [], categories: [], maxTime: 0 });

    expect('search' in q).toBe(false);
    expect('cuisines' in q).toBe(false);
    expect('categories' in q).toBe(false);
    expect('maxTime' in q).toBe(false);
  });

  it('passes sort through untouched', () => {
    expect(toRecipeListQuery({ sort: 'popular', sortOrder: 'desc' })).toMatchObject({
      sort: 'popular',
      sortOrder: 'desc',
    });
  });
});
