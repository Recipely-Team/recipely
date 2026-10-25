/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

/**
 * Liking one recipe in the mobile feed re-renders that card only. Each card
 * selects its own entry, `byRecipe[recipe.id]`, and the likes store copies every
 * other entry by reference, so their selectors return the same object and React
 * skips them. Runs against the real store; counts real renders.
 */
const mockRenders = new Map<string, number>();

jest.mock('@presentation/base/widgets/cards/recipe-card', () => ({
  RecipeCard: (props: { name: string }) => {
    mockRenders.set(props.name, (mockRenders.get(props.name) ?? 0) + 1);
    return null;
  },
}));
jest.mock('@presentation/base/hooks/auth/use-is-signed-in', () => ({ useIsSignedIn: () => true }));
jest.mock('@presentation/base/taxonomy/use-taxonomy-label', () => ({
  useTaxonomyLabel: () => ({ cuisineLabel: (key: string) => ({ name: key, emoji: '' }) }),
}));

import { View } from 'react-native';
import { act } from 'react-test-renderer';
import { create } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { RecipeListItem } from '@presentation/app/recipes/items/cards/recipe-list-item';
import { configureLikesStore } from '@application/likes/likes-store';
import type { SetRecipeLikeUseCase } from '@application/likes/set-recipe-like-use-case';
import type { LikedRecipesStore } from '@application/recipes/liked/liked-recipes-store-contract';
import type { ApplicationStores } from '@application/di/application-stores';
import { ok } from '@core/result/result-helpers';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';

const recipe = (id: string): RecipeSummaryEntity => {
  const result = RecipeSummaryEntity.create({
    photoCount: 0, id, name: id, image: '', cuisine: CuisineKey.Italian, category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy, totalTimeMinutes: 30, rating: 4, moderationStatus: 'approved', isPublished: true,
    likeCount: 0, likedByMe: false, commentCount: 0, viewCount: 0, origin: RecipeOrigin.User, sourcePlatform: null, aiWritten: false,
  });
  if (!result.ok) throw new Error('fixture');
  return result.value;
};

const IDS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'];

const setup = () => {
  const likesStore = configureLikesStore({
    setRecipeLike: { execute: jest.fn().mockResolvedValue(ok(undefined)) } as unknown as SetRecipeLikeUseCase,
    likedRecipesStore: create(() => ({ removeLocal: jest.fn() })) as unknown as StoreApi<LikedRecipesStore>,
  });
  const onOpen = jest.fn();
  renderComponent(
    <View>{IDS.map((id) => <RecipeListItem key={id} recipe={recipe(id)} onOpen={onOpen} />)}</View>,
    { likesStore } as unknown as Partial<ApplicationStores>,
  );
  mockRenders.clear();
  return likesStore;
};

describe('RecipeListItem — liking one recipe in the mobile feed', () => {
  it('re-renders the liked card only, not the other seven', async () => {
    const likesStore = setup();

    await act(async () => {
      await likesStore.getState().toggle('r3');
    });

    expect([...mockRenders.keys()]).toEqual(['r3']);
    // Once, although the store changed twice (optimistic, then settled): the settled
    // answer changes only `isLoading`, which the card is never given, so nothing new is drawn.
    expect(mockRenders.get('r3')).toBe(1);
  });

  it('renders no card when the store changes for a recipe that is not on screen', () => {
    const likesStore = setup();

    act(() => likesStore.getState().seed('elsewhere', 3, false));

    expect(mockRenders.size).toBe(0);
  });
});
