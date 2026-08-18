/**
 * Placement tests for the web feed's AdSense unit.
 *
 * A local export of the site showed the banner mounting while the grid was
 * still skeletons: the request went out against a page with nothing on it yet,
 * and on a failed load the unit was discarded unread when the error state
 * replaced the feed. That is the shape of the violation the placement rules
 * exist to prevent (CLAUDE.md §23e), so the ad waits for recipes.
 *
 * The feed's own blocks are stubbed — they read stores and taxonomy this suite
 * does not exercise, same spirit as the stubs in `recipe-list-body.test.tsx`.
 */
import type { ReactTestInstance } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { WebRecipeFeed } from '@presentation/app/recipes/body/web-recipe-feed';
import { emptyFilters } from '@presentation/app/recipes/model/filtering/ui-filter-defaults';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';
import type { UseRecipeListResult } from '@presentation/app/recipes/model/use-recipe-list-result';

const mockBanner = jest.fn();

jest.mock('@presentation/base/widgets/ads/web-banner-ad', () => ({
  WebBannerAd: (props: unknown) => mockBanner(props),
}));

jest.mock('@presentation/app/recipes/body/web-hero-section', () => ({ WebHeroSection: () => null }));
jest.mock('@presentation/app/recipes/body/web-cuisine-rail', () => ({ WebCuisineRail: () => null }));
jest.mock('@presentation/app/recipes/body/web-recipe-grid', () => ({ WebRecipeGrid: () => null }));
jest.mock('@presentation/app/recipes/sheets/all-cuisines-sheet', () => ({ AllCuisinesSheet: () => null }));

const makeRecipe = (): RecipeSummaryEntity => {
  const result = RecipeSummaryEntity.create({
    id: 'r1',
    name: 'Recipe r1',
    image: 'https://cdn.example.com/r1.webp',
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    totalTimeMinutes: 30,
    rating: 4.5,
    moderationStatus: 'approved',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    viewCount: 0,
  });
  if (!result.ok) throw new Error('failed to build RecipeSummaryEntity fixture');
  return result.value;
};

const RECIPES = [makeRecipe()];

const loadedVm = (): UseRecipeListResult =>
  ({
    state: { status: 'loaded', query: '', recipes: RECIPES, page: 1, hasMore: false },
    recipes: RECIPES,
    isSearching: false,
    isReloadingResults: false,
    isRefetching: false,
    filters: emptyFilters,
    activeCuisineLabel: null,
    activeFilterCount: 0,
    gridColumns: 3,
    sortBy: 'popular',
    isSaved: () => false,
    onToggleSave: jest.fn(),
    onOpenRecipe: jest.fn(),
    onOpenCreate: jest.fn(),
    onRefresh: jest.fn(),
    onChangeSort: jest.fn(),
    onOpenFilter: jest.fn(),
    onDifficultyChange: jest.fn(),
    onToggleCuisineQuick: jest.fn(),
    onResetFilters: jest.fn(),
  }) as unknown as UseRecipeListResult;

const render = (overrides: Partial<UseRecipeListResult>): ReactTestInstance => {
  const { root } = renderComponent(<WebRecipeFeed vm={{ ...loadedVm(), ...overrides }} />);
  return root;
};

describe('WebRecipeFeed', () => {
  beforeEach(() => {
    mockBanner.mockReset().mockReturnValue(null);
  });

  it('carries the ad once recipes are on the page', () => {
    render({});

    expect(mockBanner).toHaveBeenCalled();
  });

  it('asks for nothing while the grid is still loading', () => {
    render({ state: { status: 'loading', query: '' } as UseRecipeListResult['state'], recipes: [] });

    expect(mockBanner).not.toHaveBeenCalled();
  });

  it('asks for nothing when the feed came back empty', () => {
    render({ recipes: [] });

    expect(mockBanner).not.toHaveBeenCalled();
  });

  it('asks for nothing during a search, where the results are the whole page', () => {
    render({ isSearching: true });

    expect(mockBanner).not.toHaveBeenCalled();
  });
});
