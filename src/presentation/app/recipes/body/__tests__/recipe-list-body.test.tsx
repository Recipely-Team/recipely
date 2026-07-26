/**
 * Wiring tests for the mobile `RefreshControl` in `RecipeListBody`.
 *
 * The iOS bug: tapping a cuisine filter made the list slide down and snap back
 * like a refresh, because `refreshing` was driven from
 * `isRecipeListRefreshing(state)` — true for EVERY in-place refetch. Setting
 * `refreshing` programmatically on iOS calls `UIRefreshControl.beginRefreshing`,
 * which animates the scroll view down and back.
 *
 * `use-recipe-list.test.tsx` pins the hook's `isPullRefreshing` flag; this suite
 * pins the prop wiring, which is the line that actually broke. The discriminating
 * case is a vm where the two disagree: the store IS refreshing while the pull flag
 * is false, so a revert to `isRecipeListRefreshing(state)` fails here.
 *
 * `RecipeListItem` is stubbed (it reads likes/auth stores to render a card this
 * wiring doesn't touch) so a non-empty feed — required to reach the mobile
 * `FlatList` branch — stays cheap. Same spirit as the `SkeletonCard` stub in
 * `web-recipe-grid.test.tsx`. The feed header's taxonomy hooks are served by a
 * real (empty) `taxonomyStore` rather than a mock: they fall back to the bundled
 * enums + i18n names, so the header renders through production code.
 */

import { act } from 'react-test-renderer';
import { Platform, RefreshControl, ScrollView } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { create } from 'zustand';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { RecipeListBody } from '@presentation/app/recipes/body/recipe-list-body';
import { emptyFilters } from '@presentation/app/recipes/model/ui-filter-defaults';
import type { UseRecipeListResult } from '@presentation/app/recipes/model/use-recipe-list-result';
import { isRecipeListRefreshing } from '@application/recipes/list/is-recipe-list-refreshing';
import { layoutSizes } from '@presentation/base/theme';
import type { TaxonomyStoreState } from '@application/recipes/taxonomy/taxonomy-store-state';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

jest.mock('@presentation/app/recipes/items/cards/recipe-list-item', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { RecipeListItem: (): React.JSX.Element => <Text>recipe-list-item</Text> };
});

const makeRecipe = (id: string): RecipeSummaryEntity => {
  const result = RecipeSummaryEntity.create({
    id,
    name: `Recipe ${id}`,
    image: `https://cdn.example.com/${id}.webp`,
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

const RECIPES = [makeRecipe('r1')];

/** An un-loaded taxonomy store: labels/options fall back to the bundled enums. */
const makeStores = (): Stores =>
  ({
    taxonomyStore: create<TaxonomyStoreState>(() => ({
      cuisines: [],
      categories: [],
      status: 'idle',
      failure: null,
      load: jest.fn(),
      reload: jest.fn(),
    })),
  }) as unknown as Stores;

/**
 * A vm on the mobile loaded-feed branch (`recipe-list-body.tsx:149-150`):
 * not the web shell, loaded, not searching, non-empty results.
 */
const baseVm = (): Omit<UseRecipeListResult, 'scrollY' | 'headerTranslateY' | 'scrollHandler'> => ({
  state: { status: 'loaded', recipes: RECIPES },
  filteredRecipes: RECIPES,
  isWebShell: false,
  isSearching: false,
  activeFilterCount: 0,
  gridColumns: 1,
  sortBy: 'popular',
  filters: emptyFilters,
  activeCuisineLabel: null,
  unreadCount: 0,
  reduceMotion: true,
  search: '',
  onSearchChange: jest.fn(),
  isPullRefreshing: false,
  onRefresh: jest.fn(),
  onOpenRecipe: jest.fn(),
  onOpenCreate: jest.fn(),
  onNotifications: jest.fn(),
  isSaved: () => false,
  onToggleSave: jest.fn(),
  onChangeSort: jest.fn(),
  onToggleCuisineQuick: jest.fn(),
  onDifficultyChange: jest.fn(),
  onRemoveCategory: jest.fn(),
  onRemoveDifficulty: jest.fn(),
  onRemoveMaxTime: jest.fn(),
  onResetFilters: jest.fn(),
  sheetOpen: null,
  pendingFilters: emptyFilters,
  pendingSort: 'popular',
  onOpenFilter: jest.fn(),
  onCloseSheet: jest.fn(),
  onSelectPendingSort: jest.fn(),
  onTogglePendingCuisine: jest.fn(),
  onTogglePendingCategory: jest.fn(),
  onTogglePendingDifficulty: jest.fn(),
  onSetPendingMaxTime: jest.fn(),
  onApplyFilters: jest.fn(),
  promptVisible: false,
  promptMessage: undefined,
  onClosePrompt: jest.fn(),
  onGoToSignIn: jest.fn(),
});

interface HarnessProps {
  overrides: Partial<UseRecipeListResult>;
}

/** Supplies the reanimated values the body needs, which must come from hooks. */
const Harness = ({ overrides }: HarnessProps): React.JSX.Element => {
  const scrollY = useSharedValue(0);
  const headerTranslateY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({ onScroll: () => {} });

  const vm: UseRecipeListResult = {
    ...baseVm(),
    scrollY,
    headerTranslateY,
    scrollHandler,
    ...overrides,
  };

  return (
    <StoresProvider value={makeStores()}>
      <RecipeListBody vm={vm} />
    </StoresProvider>
  );
};

/** Renders the body with vm overrides and returns the tree root. */
const render = (overrides: Partial<UseRecipeListResult>): ReactTestInstance => {
  const { root } = renderComponent(<Harness overrides={overrides} />);
  return root;
};

/**
 * The `refreshing` prop the rendered RefreshControl actually receives. Throws
 * rather than returning a default if the control or the prop goes missing, so
 * these tests can't pass vacuously.
 */
const refreshingProp = (overrides: Partial<UseRecipeListResult>): boolean => {
  const refreshing = render(overrides).findByType(RefreshControl).props.refreshing;

  if (typeof refreshing !== 'boolean') {
    throw new Error(`expected a boolean 'refreshing' prop, got ${String(refreshing)}`);
  }
  return refreshing;
};

/**
 * The vm overrides that land on the empty branch: loaded, mobile, not searching,
 * zero filtered results. `withFilters` picks which empty copy renders — the
 * "no results" + clear-filters button (filters active) or the "empty" + retry
 * button (no filters).
 */
const emptyVm = (withFilters: boolean): Partial<UseRecipeListResult> => ({
  state: { status: 'loaded', recipes: [] },
  filteredRecipes: [],
  activeFilterCount: withFilters ? 1 : 0,
  filters: withFilters ? { ...emptyFilters, cuisines: [CuisineKey.Italian] } : emptyFilters,
});

describe('RecipeListBody — mobile RefreshControl wiring', () => {
  // AppThemeProvider hydrates theme/preference from async storage on mount; let
  // those promises settle inside act so a late re-render can't fire after the
  // Jest environment is torn down — same pattern as the sibling body suites.
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('leaves the spinner off during a filter refetch, when the store refreshes but the user did not pull', () => {
    const state: UseRecipeListResult['state'] = {
      status: 'loaded',
      recipes: RECIPES,
      isRefreshing: true,
    };

    // Precondition: this is exactly the state the old
    // `refreshing={isRecipeListRefreshing(state)}` wiring turned into a spinner
    // (and an iOS scroll jump) on a plain filter tap.
    expect(isRecipeListRefreshing(state)).toBe(true);

    expect(refreshingProp({ state, isPullRefreshing: false })).toBe(false);
  });

  it('shows the spinner while a pull-to-refresh is in flight', () => {
    const state: UseRecipeListResult['state'] = {
      status: 'loaded',
      recipes: RECIPES,
      isRefreshing: true,
    };

    expect(refreshingProp({ state, isPullRefreshing: true })).toBe(true);
  });

  it('leaves the spinner off on a settled list', () => {
    expect(refreshingProp({ isPullRefreshing: false })).toBe(false);
  });

  it('drives the spinner from the pull flag even when the store reports no refresh', () => {
    // Guards the inverse mis-wiring: `isPullRefreshing` must be the source of
    // truth, not a value derived from `state`.
    expect(refreshingProp({ isPullRefreshing: true })).toBe(true);
  });

  it('offsets the spinner below the collapsing header so it is not hidden behind it', () => {
    // The header band is absolutely positioned and opaque over the list; without
    // this offset the spinner renders behind it and reads as no refresh at all.
    // iOS applies the value as a raw frame shift, so the full band height is right.
    const control = render({ isPullRefreshing: false }).findByType(RefreshControl);

    expect(control.props.progressViewOffset).toBe(layoutSizes.homeHeaderMax);
  });

  it('uses the smaller Android offset so the spinner rests under the band, not over the AI banner', () => {
    // Android's SwipeRefreshLayout rests the circle at `offset + 64dp - diameter`,
    // so the full band height parks it ~60dp too low, floating over content.
    const selectSpy = jest
      .spyOn(Platform, 'select')
      .mockImplementation((spec) => spec.android ?? (spec as { default?: unknown }).default);

    try {
      const control = render({ isPullRefreshing: false }).findByType(RefreshControl);

      expect(control.props.progressViewOffset).toBe(layoutSizes.homeRefreshOffsetAndroid);
    } finally {
      selectSpy.mockRestore();
    }
  });

  it('binds the feed pull handler to onRefresh', () => {
    const onRefresh = jest.fn();

    const control = render({ onRefresh }).findByType(RefreshControl);

    expect(control.props.onRefresh).toBe(onRefresh);
  });
});

describe('RecipeListBody — empty state is pullable', () => {
  // Same async-storage settle as the sibling body suites (see above).
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  // `true` renders the "no results" + clear-filters branch, `false` the "empty"
  // + retry branch — both must sit on the same pullable surface.
  const FLAVORS: readonly boolean[] = [true, false];

  it.each(FLAVORS)('hangs the RefreshControl off a ScrollView (filters active: %s)', (withFilters) => {
    const onRefresh = jest.fn();

    const root = render({ ...emptyVm(withFilters), onRefresh });

    // A plain View would render the icon and copy but swallow the pull gesture:
    // the control must hang off the ScrollView that replaced it.
    const scrollView = root.findByType(ScrollView);
    expect(scrollView.props.refreshControl).toBeDefined();
    expect(root.findByType(RefreshControl).props.onRefresh).toBe(onRefresh);
  });

  it.each(FLAVORS)('mirrors the pull flag on the empty surface (filters active: %s)', (withFilters) => {
    expect(refreshingProp({ ...emptyVm(withFilters), isPullRefreshing: true })).toBe(true);
    expect(refreshingProp({ ...emptyVm(withFilters), isPullRefreshing: false })).toBe(false);
  });

  it.each(FLAVORS)('lets the empty content grow so the pull gesture has a surface (filters active: %s)', (withFilters) => {
    const root = render(emptyVm(withFilters));

    // Without flexGrow the content collapses to its natural height and there is
    // nothing tall enough to pull on.
    const contentStyle = root.findByType(ScrollView).props.contentContainerStyle;
    expect(contentStyle).toEqual(expect.objectContaining({ flexGrow: 1 }));
  });
});
