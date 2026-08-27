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
import { Platform, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { create } from 'zustand';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { RecipeListBody } from '@presentation/app/recipes/body/recipe-list-body';
import { emptyFilters } from '@presentation/app/recipes/model/filtering/ui-filter-defaults';
import type { UseRecipeListResult } from '@presentation/app/recipes/model/use-recipe-list-result';
import { isRecipeListRefreshing } from '@application/recipes/list/is-recipe-list-refreshing';
import { t } from '@presentation/i18n';
import { layoutSizes } from '@presentation/base/theme';
import { ListConstants } from '@presentation/base/constants';
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
  state: { status: 'loaded', query: '', recipes: RECIPES, page: 1, hasMore: false },
  recipes: RECIPES,
  isWebShell: false,
  isExpanded: false,
  isSearching: false,
  isRefetching: false,
  isReloadingResults: false,
  isLoadingMore: false,
  onEndReached: jest.fn(),
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
  attachList: jest.fn(),
  onAssistantScroll: jest.fn(),
  onToggleCategory: jest.fn(),
  onSetMaxTime: jest.fn(),
  onRemoveCategory: jest.fn(),
  onRemoveDifficulty: jest.fn(),
  onRemoveMaxTime: jest.fn(),
  onResetFilters: jest.fn(),
  onClearSearch: jest.fn(),
  onClearAllFilters: jest.fn(),
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
 * The vm overrides for a loaded-but-empty mobile feed. `withFilters` picks which
 * empty copy renders — the "no results" + clear-filters button (filters active)
 * or the "empty" + retry button (no filters).
 */
const emptyVm = (withFilters: boolean): Partial<UseRecipeListResult> => ({
  state: { status: 'loaded', query: '', recipes: [], page: 1, hasMore: false },
  recipes: [],
  activeFilterCount: withFilters ? 1 : 0,
  filters: withFilters ? { ...emptyFilters, cuisines: [CuisineKey.Italian] } : emptyFilters,
});

/** Every string the tree rendered, for presence assertions on header copy. */
const renderedText = (root: ReactTestInstance): string[] => textContent(root);

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
      query: '',
      recipes: RECIPES,
      page: 1,
      hasMore: false,
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
      query: '',
      recipes: RECIPES,
      page: 1,
      hasMore: false,
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

  it.each(FLAVORS)('hangs the RefreshControl off a scrollable surface (filters active: %s)', (withFilters) => {
    const onRefresh = jest.fn();

    const root = render({ ...emptyVm(withFilters), onRefresh });

    // A plain View would render the icon and copy but swallow the pull gesture:
    // the control must hang off the list's own scroll view.
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
    // nothing tall enough to pull on. The style arrives as an array of the
    // list's two content styles, so flatten before asserting.
    const contentStyle = StyleSheet.flatten(
      root.findByType(ScrollView).props.contentContainerStyle as StyleProp<ViewStyle>,
    );
    expect(contentStyle.flexGrow).toBe(1);
  });
});

/**
 * The Android bug: selecting a filter that matches nothing swapped the whole
 * list out for a centered empty state, which unmounted `MobileFeedHeader` — and
 * with it the cuisine strip, the only control that can un-tap a single cuisine.
 * The user was stranded: either keep the empty feed or "Clear all" and lose the
 * other filters too. The header must survive a zero-result feed.
 */
describe('RecipeListBody — an empty feed keeps its filter controls', () => {
  // Same async-storage settle as the sibling body suites (see above).
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('still renders the cuisine strip when a filter matched nothing', () => {
    const root = render(emptyVm(true));

    // The strip is how a single cuisine gets deselected; its section heading
    // standing in for it here is enough to prove the header was not unmounted.
    expect(renderedText(root)).toContain(t().recipes.browseCuisines);
  });

  it('renders the no-results copy alongside the header, not instead of it', () => {
    const text = renderedText(render(emptyVm(true)));

    expect(text).toContain(t().recipes.noResults);
    expect(text).toContain(t().recipes.browseCuisines);
  });

  it('keeps the strip on an empty feed with no filters at all', () => {
    // The plain-empty branch (backend returned nothing) must not lose the strip
    // either — browsing by cuisine is the way out of an empty default feed.
    const text = renderedText(render(emptyVm(false)));

    expect(text).toContain(t().recipes.empty);
    expect(text).toContain(t().recipes.browseCuisines);
  });
});

/**
 * Reported from the home feed: "recipes look like they load twice". A filter
 * tap kept the previous rows on screen behind a floating "Refreshing…" pill,
 * so one tap produced two sets of recipes in sequence — and while the stale
 * ones were up, nothing said the tap had registered. The rows are now replaced
 * by a loading placeholder for the round trip, and only for the loads that
 * change what the list should contain.
 */
describe('RecipeListBody — reloading the results', () => {
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  /** The rows the list was actually handed — virtualization keeps them out of the tree. */
  const listData = (overrides: Partial<UseRecipeListResult>): unknown[] => {
    const list = render(overrides).findAll((node) => Array.isArray(node.props.data))[0];
    if (list === undefined) throw new Error('no list rendered');
    return list.props.data as unknown[];
  };

  it('replaces the rows with the loading copy while new results are fetched', () => {
    expect(listData({ isReloadingResults: true })).toHaveLength(0);
    expect(renderedText(render({ isReloadingResults: true }))).toContain(t().common.loading);
  });

  it('keeps the feed header up, so the filter that started the load can be undone', () => {
    const root = render({
      isReloadingResults: true,
      activeFilterCount: 1,
      filters: { ...emptyFilters, cuisines: [CuisineKey.Italian] },
    });

    // The cuisine strip and the active-filter chips live in the list header,
    // which must survive the blanked rows — un-tapping is the way out.
    expect(renderedText(root)).toContain(t().recipes.browseCuisines);
  });

  it('shows the rows again once the results land', () => {
    expect(listData({ isReloadingResults: false })).toHaveLength(RECIPES.length);
    expect(renderedText(render({ isReloadingResults: false }))).not.toContain(t().common.loading);
  });

  it('does not blank the rows for a pull-to-refresh', () => {
    // The pull spinner is the indicator there, and the rows have to stay under
    // the finger that is pulling them.
    expect(listData({ isPullRefreshing: true })).toHaveLength(RECIPES.length);
    expect(renderedText(render({ isPullRefreshing: true }))).not.toContain(t().common.loading);
  });

  it('leaves the first load to the shimmer, not the reload copy', () => {
    // A cold open still gets skeleton cards; the placeholder is for the loads
    // that REPLACE a list the user is already looking at.
    const texts = renderedText(render({ state: { status: 'loading' }, isReloadingResults: true }));

    expect(texts).not.toContain(t().common.loading);
  });

  it('keeps the empty-state copy for a loaded-but-empty feed', () => {
    const texts = renderedText(render({ ...emptyVm(false), isReloadingResults: false }));

    expect(texts).toContain(t().recipes.empty);
    expect(texts).not.toContain(t().common.loading);
  });
});

describe('RecipeListBody — the feed does not clip its own children', () => {
  // Same async-storage settle as the sibling body suites (see above).
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  // The symptom: on Android, opening a finished Instagram import closed the app
  // — back to Instagram, and unopenable without force-quitting it. The crash was
  // `IllegalStateException: addViewAt: failed to insert view [332] into parent
  // [338]`, thrown from `ReactClippingViewManager.addView`: the class that
  // exists to implement `removeClippedSubviews`.
  //
  // This feed is not the screen that crashed — it is the screen UNDERNEATH it.
  // A share intent pushes the import over `/recipes`, so when the stack
  // transition to the editor finished, the feed re-laid-out, recalculated its
  // clipping, and handed Fabric a child view it had already parented elsewhere.
  // That is also why opening the same draft from My Recipes never crashed:
  // a different list, without this prop, sits under that route.
  //
  // The prop moves views in and out of the native hierarchy outside React's
  // reconciliation, which the New Architecture does not tolerate. Windowing —
  // `windowSize` / `maxToRenderPerBatch` / `initialNumToRender`, all still set
  // above — is the supported way to bound how many rows stay mounted.
  // Asserted with `Platform.OS` forced to 'android', which is the whole point:
  // the prop was written as `Platform.OS === 'android'`, so under Jest's default
  // 'ios' it evaluates to false and a test that just reads it back passes
  // against the unfixed code. It has to be checked where it was true.
  it('never sets removeClippedSubviews on the mobile feed, on Android', () => {
    const platform = jest.replaceProperty(Platform, 'OS', 'android');

    try {
      const list = render({}).findByType(Animated.FlatList);

      expect(list.props.removeClippedSubviews).toBeFalsy();
    } finally {
      platform.restore();
    }
  });

  // The windowing that actually bounds mounted rows must survive: dropping the
  // clipping prop is only safe while these are the thing doing the work.
  it('still bounds the mounted rows with windowing props', () => {
    const list = render({}).findByType(Animated.FlatList);

    expect(list.props.windowSize).toBe(ListConstants.windowSize);
    expect(list.props.maxToRenderPerBatch).toBe(ListConstants.rowsPerBatch);
    expect(list.props.initialNumToRender).toBe(ListConstants.initialRows);
  });
});
