/**
 * The symptom: saving one recipe on the web feed re-rendered the whole feed —
 * the page hook subscribed to the entire saved-id set, so `isSaved` changed
 * identity, the grid's `renderItem` changed with it, and every memoised card
 * on screen rendered again to show one bookmark flipping.
 *
 * Measured with React's `<Profiler>`: the real `useRecipeList` drives the real
 * `WebRecipeFeed` and `WebRecipeGrid` over a loaded page of recipes, one
 * recipe is saved through the store, and the test counts who rendered.
 */

/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

const mockRenders = { page: 0, cards: 0, cardIds: [] as string[] };

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  usePathname: jest.fn(() => '/recipes'),
  useLocalSearchParams: jest.fn(() => ({})),
  useFocusEffect: jest.fn((callback: () => void) => {
    jest.requireActual<typeof import('react')>('react').useEffect(callback, [callback]);
  }),
}));
jest.mock('@presentation/base/web-shell/use-web-shell-state', () => ({
  useWebShellState: () => ({ searchQuery: '', setSearchQuery: jest.fn() }),
}));
jest.mock('@presentation/base/responsive/use-layout', () => {
  const actual = jest.requireActual<typeof import('@presentation/base/responsive/use-layout')>('@presentation/base/responsive/use-layout');
  return { useLayout: () => ({ ...actual.useLayout(), isExpanded: true, isWebShell: true, width: 1280, height: 900 }) };
});
jest.mock('@presentation/base/taxonomy/use-taxonomy-label', () => ({
  useTaxonomyLabel: jest.fn(() => ({
    cuisineLabel: (key: string) => ({ name: key, emoji: '🍝' }),
    categoryLabel: (key: string) => ({ name: key, emoji: '🍽️' }),
  })),
}));
// Not what is measured: the surfaces around the grid.
jest.mock('@presentation/base/widgets/ads/web-banner-ad', () => ({ WebBannerAd: () => null }));
jest.mock('@presentation/app/recipes/body/web-hero-section', () => ({ WebHeroSection: () => null }));
jest.mock('@presentation/app/recipes/body/web-cuisine-rail', () => ({ WebCuisineRail: () => null }));
jest.mock('@presentation/app/recipes/sheets/all-cuisines-sheet', () => ({ AllCuisinesSheet: () => null }));
jest.mock('@presentation/base/widgets/cards/web-recipe-card', () => {
  const actual = jest.requireActual('@presentation/base/widgets/cards/web-recipe-card');
  return {
    WebRecipeCard: (props: { recipe: { id: string } }) => {
      mockRenders.cards += 1;
      mockRenders.cardIds.push(props.recipe.id);
      return actual.WebRecipeCard(props);
    },
  };
});

import { Profiler } from 'react';
import { act } from 'react-test-renderer';
import { create } from 'zustand';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useRecipeList } from '@presentation/app/recipes/hooks/use-recipe-list';
import { WebRecipeFeed } from '@presentation/app/recipes/body/web-recipe-feed';
import { configureRecipeListStore } from '@application/recipes/list/recipe-list-store';
import type { ListRecipesUseCase } from '@application/recipes/list/list-recipes-use-case';
import type { ApplicationStores } from '@application/di/application-stores';
import type { SavedRecipesStore } from '@application/recipes/saved/saved-recipes-store-contract';
import { recipePageOf } from '@application/__fixtures__/recipe-page-of';
import { ok } from '@core/result/result-helpers';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';

const RECIPE_COUNT = 12;
const SAVES = 5;

const makeRecipe = (id: string): RecipeSummaryEntity => {
  const result = RecipeSummaryEntity.create({
    photoCount: 0,
    id,
    name: `Recipe ${id}`,
    image: `https://cdn.example.com/${id}.webp`,
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
  });
  if (!result.ok) throw new Error('failed to build RecipeSummaryEntity fixture');
  return result.value;
};

const recipes = Array.from({ length: RECIPE_COUNT }, (_, at) => makeRecipe(`r${at}`));

const FeedPage = (): React.JSX.Element => {
  mockRenders.page += 1;
  return <WebRecipeFeed vm={useRecipeList()} />;
};

it('saving one recipe re-renders that card only, not the feed page or the other cards', async () => {
  const recipeListStore = configureRecipeListStore({
    listRecipes: { execute: jest.fn().mockResolvedValue(ok(recipePageOf(recipes))) } as unknown as ListRecipesUseCase,
  });
  const savedRecipesStore = create<SavedRecipesStore>(() => ({
    savedIds: new Set<string>(),
    setSavedIds: jest.fn(),
  }) as unknown as SavedRecipesStore);
  const stores = {
    recipeListStore,
    savedRecipesStore,
    authStore: create(() => ({ state: { status: 'unauthenticated' } })),
    favoritesStore: create(() => ({ pending: new Set<string>() })),
    likesStore: create(() => ({ byRecipe: {}, seed: jest.fn() })),
    notificationsStore: create(() => ({})),
    myRecipesStore: create(() => ({ version: 0 })),
    loadFavoritesUseCase: { execute: jest.fn().mockResolvedValue(ok([])) },
  } as unknown as Partial<ApplicationStores>;

  let duration = 0;
  let measuring = false;
  renderComponent(
    <Profiler id="feed" onRender={(_id, _phase, actual) => { if (measuring) duration += actual; }}>
      <FeedPage />
    </Profiler>,
    stores,
  );
  await act(async () => undefined);
  const mountedCards = new Set(mockRenders.cardIds).size;

  mockRenders.page = 0;
  mockRenders.cards = 0;
  mockRenders.cardIds = [];
  measuring = true;
  for (let at = 0; at < SAVES; at += 1) {
    const saved = new Set(savedRecipesStore.getState().savedIds);
    saved.add(`r${at}`);
    act(() => savedRecipesStore.setState({ savedIds: saved }));
  }
  measuring = false;

  if (process.env['PROFILE_RENDERS'] === '1') {
    process.stdout.write(
      `[profile] web feed, ${mountedCards} cards mounted, ${SAVES} saves: page=${mockRenders.page} cards=${mockRenders.cards} actualDuration=${duration.toFixed(1)}ms\n`,
    );
  }
  expect(mountedCards).toBeGreaterThan(SAVES);
  expect(mockRenders.page).toBe(0);
  // One card per save: the card whose bookmark flipped.
  expect(mockRenders.cards).toBe(SAVES);
  expect(new Set(mockRenders.cardIds)).toEqual(new Set(Array.from({ length: SAVES }, (_, at) => `r${at}`)));
});
