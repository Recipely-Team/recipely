/**
 * Reported: "the lists reorder themselves as you move between pages". The
 * saved grid was the FEED's loaded page filtered by id, so it inherited the
 * feed's ordering — which changes with whatever sort the user last picked on
 * the home screen and again after every silent refetch. The favourite ids are
 * the one order that belongs to this screen.
 */

import { orderSavedRecipes } from '@presentation/app/my-recipes/model/order-saved-recipes';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { Difficulty } from '@domain/recipes/difficulty';

const makeRecipe = (id: string): RecipeSummaryEntity => {
  const result = RecipeSummaryEntity.create({
    id,
    name: `Recipe ${id}`,
    image: 'https://cdn.example.com/r.webp',
    cuisine: 'ITALIAN',
    category: 'DINNER',
    difficulty: Difficulty.Easy,
    totalTimeMinutes: 30,
    rating: 0,
    moderationStatus: 'approved',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    viewCount: 0,
  });
  if (!result.ok) throw new Error('fixture recipe invalid');
  return result.value;
};

const ids = (recipes: readonly RecipeSummaryEntity[]): string[] => recipes.map((r) => r.id);

describe('orderSavedRecipes', () => {
  it('follows the favourite order, not the order of the loaded page', () => {
    const saved = new Set(['c', 'a', 'b']);
    const feedPage = [makeRecipe('a'), makeRecipe('b'), makeRecipe('c')];

    expect(ids(orderSavedRecipes(saved, feedPage))).toEqual(['c', 'a', 'b']);
  });

  it('returns the same order when the page comes back reshuffled', () => {
    const saved = new Set(['c', 'a', 'b']);
    const first = orderSavedRecipes(saved, [makeRecipe('a'), makeRecipe('b'), makeRecipe('c')]);
    // The same recipes, as a differently-sorted feed would deliver them.
    const second = orderSavedRecipes(saved, [makeRecipe('b'), makeRecipe('c'), makeRecipe('a')]);

    expect(ids(second)).toEqual(ids(first));
  });

  it('skips favourites that are not in the loaded page', () => {
    const saved = new Set(['a', 'missing', 'b']);

    expect(ids(orderSavedRecipes(saved, [makeRecipe('a'), makeRecipe('b')]))).toEqual(['a', 'b']);
  });

  it('drops recipes that are not saved', () => {
    const saved = new Set(['b']);

    expect(ids(orderSavedRecipes(saved, [makeRecipe('a'), makeRecipe('b')]))).toEqual(['b']);
  });

  it('is empty when nothing is saved', () => {
    expect(orderSavedRecipes(new Set(), [makeRecipe('a')])).toHaveLength(0);
  });
});
