/**
 * Recipely Kitchen recipes carry two credits the app must keep: the cover
 * photo's author and licence, and the database the nutrition came from. Both
 * are absent on every other recipe and on an older server — and neither may
 * draw a line it cannot fill.
 */

import { toRecipe, toRecipeSummary } from '@infrastructure/recipes/recipe-mapper';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';
import { ProvenanceMark } from '@domain/recipes/provenance/provenance-mark';
import { NutritionSource } from '@domain/recipes/nutrition/nutrition-source';
import type { RecipeDto } from '@infrastructure/recipes/dtos/recipe-dto';
import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';

const CREDIT = { author: 'Jane Doe', license: 'CC-BY-SA-4.0', url: 'https://commons.wikimedia.org/wiki/File:Pilaf.jpg' };

const detail = (overrides: Partial<RecipeDto> = {}) => {
  const result = toRecipe({
    id: 'r1', name: 'Pilaf', cuisine: 'TURKISH', category: 'MAIN', difficulty: 'EASY', ingredients: ['rice'],
    instructions: ['Cook.'], prepTimeMinutes: 5, cookTimeMinutes: 20, servings: 4, caloriesPerServing: 300,
    image: 'https://cdn.example.com/p.jpg', rating: 0, tags: [], mealType: [], ownerId: 'kitchen', likeCount: 0,
    likedByMe: false, commentCount: 0, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z',
    viewCount: 0, moderationStatus: 'approved', ...overrides,
  } as RecipeDto);
  if (!result.ok) throw new Error('expected the recipe to map');
  return result.value;
};

const summary = (overrides: Partial<RecipeListItemDto> = {}) => {
  const result = toRecipeSummary({
    id: 'r1', name: 'Pilaf', image: '', cuisine: 'TURKISH', category: 'MAIN', difficulty: 'EASY', rating: 0,
    moderationStatus: 'approved', likeCount: 0, likedByMe: false, commentCount: 0, viewCount: 0, ...overrides,
  } as RecipeListItemDto);
  if (!result.ok) throw new Error('expected the summary to map');
  return result.value;
};

describe('toRecipe — Recipely Kitchen', () => {
  it('reads a curated recipe with its credit and nutrition source', () => {
    const recipe = detail({ origin: 'CURATED', aiWritten: false, imageCredit: CREDIT, nutritionSource: 'USDA_FDC' });

    expect(recipe.origin).toBe(RecipeOrigin.Curated);
    expect(recipe.provenanceMarks).toEqual([ProvenanceMark.Curated]);
    expect([recipe.imageCredit?.author, recipe.imageCredit?.license, recipe.imageCredit?.url]).toEqual([
      CREDIT.author,
      CREDIT.license,
      CREDIT.url,
    ]);
    expect(recipe.nutritionSource).toBe(NutritionSource.Usda);
  });

  it.each([null, undefined])('shows no credit for %p', (imageCredit) => {
    expect(detail({ imageCredit }).imageCredit).toBeNull();
  });

  it('drops a credit whose link is not a web address', () => {
    expect(detail({ imageCredit: { ...CREDIT, url: 'javascript:void(0)' } }).imageCredit).toBeNull();
  });

  it('names no source it does not know', () => {
    expect(detail({ nutritionSource: 'CIQUAL' }).nutritionSource).toBeNull();
    expect(detail({ nutritionSource: null }).nutritionSource).toBeNull();
  });
});

describe('toRecipeSummary — Recipely Kitchen', () => {
  it('carries the curated mark, credit and source onto a card', () => {
    const card = summary({ origin: 'CURATED', aiWritten: false, imageCredit: CREDIT, nutritionSource: 'USDA_FDC' });

    expect(card.provenanceMarks).toEqual([ProvenanceMark.Curated]);
    expect(card.imageCredit?.author).toBe(CREDIT.author);
    expect(card.nutritionSource).toBe(NutritionSource.Usda);
  });

  it('carries neither from an older server', () => {
    const card = summary();

    expect(card.imageCredit).toBeNull();
    expect(card.nutritionSource).toBeNull();
  });
});
