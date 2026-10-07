/**
 * A feed card with several photos showed no photo-count chip: the chip landed
 * in the card (#476) but nothing passed it a count, because the list API sent
 * none. The backend now sends `mediaCount`; this pins the last hop — the
 * summary's count reaching the card the feed and search render.
 */

import { create } from 'zustand';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import type { ApplicationStores } from '@application/di/application-stores';
import { RecipeListItem } from '@presentation/app/recipes/items/cards/recipe-list-item';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';

jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return Icon;
});
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return Icon;
});

const summary = (photoCount: number): RecipeSummaryEntity => {
  const result = RecipeSummaryEntity.create({
    id: 'r1',
    name: 'Tomato Soup',
    image: '',
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    totalTimeMinutes: 30,
    rating: 4.5,
    moderationStatus: 'approved',
    isPublished: true,
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    viewCount: 0,
    origin: RecipeOrigin.User,
    sourcePlatform: null,
    aiWritten: false,
    photoCount,
  });
  if (!result.ok) throw new Error('failed to build RecipeSummaryEntity fixture');
  return result.value;
};

const stores = (): Partial<ApplicationStores> =>
  ({
    likesStore: create(() => ({ byRecipe: {}, seed: jest.fn(), toggle: jest.fn() })),
    authStore: create(() => ({ state: { status: 'unauthenticated' } })),
    taxonomyStore: create(() => ({ cuisines: [], categories: [], status: 'idle', failure: null })),
  }) as unknown as Partial<ApplicationStores>;

describe('RecipeListItem — photo count', () => {
  it('shows the chip with the count a multi-photo recipe carries', () => {
    const { root } = renderComponent(<RecipeListItem recipe={summary(4)} onOpen={jest.fn()} />, stores());

    const texts = textContent(root);
    expect(texts).toContain('icon:image');
    expect(texts).toContain('4');
  });

  it('shows no chip for a recipe whose only photo is its cover', () => {
    const { root } = renderComponent(<RecipeListItem recipe={summary(1)} onOpen={jest.fn()} />, stores());

    expect(textContent(root)).not.toContain('icon:image');
  });
});
