import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AssistantScrollDirectionType } from '@presentation/base/hooks/assistant/args/assistant-scroll-direction';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { RecipeSheet } from '@presentation/app/recipes/model/recipe-sheet';
import { scrollTargetFor } from '@presentation/base/hooks/assistant/args/scroll-tuning';
import { StoreStatus } from '@application/store/store-status';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedRef, useAnimatedScrollHandler, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { type Href, useFocusEffect, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useSaveRecipe } from '@presentation/base/hooks/recipes/use-save-recipe';
import { hiddenHeaderOffset } from '@presentation/app/recipes/model/hidden-header-offset';
import { SORT_TO_FILTER } from '@presentation/app/recipes/model/sorting/recipe-sort';
import { SortKey } from '@presentation/app/recipes/model/sorting/sort-key';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useDebouncedValue } from '@presentation/base/hooks/interaction/use-debounced-value';
import { SEARCH_DEBOUNCE_MS } from '@presentation/app/recipes/model/search-debounce';
import { useRefreshFailureToast } from '@presentation/app/recipes/hooks/use-refresh-failure-toast';
import { useGuestGate } from '@presentation/app/recipes/shared/hooks/use-guest-gate';
import { isRecipeListRefreshing } from '@application/recipes/list/is-recipe-list-refreshing';
import type { UiFilters } from '@presentation/app/recipes/model/filtering/ui-filters';
import { emptyFilters } from '@presentation/app/recipes/model/filtering/ui-filter-defaults';
import * as mutate from '@presentation/app/recipes/model/filtering/filter-mutations';
import type { UseRecipeListResult } from '@presentation/app/recipes/model/use-recipe-list-result';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useWebShellState } from '@presentation/base/web-shell/use-web-shell-state';
import { t, useLocale } from '@presentation/i18n';
import { spacing, layoutSizes, durations } from '@presentation/base/theme';
import { feedContentWidth } from '@presentation/app/recipes/model/feed-content-width';
import type { Difficulty } from '@domain/recipes/difficulty';
import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

const RECIPE_CARD_MIN_WIDTH = 300;
const GRID_GAP = spacing.lg2;
/** Snap/timing config for the mobile collapsing header band (Material small-top-app-bar feel). */
const HEADER_TIMING = { duration: durations.headerCollapse, easing: Easing.out(Easing.cubic) } as const;
/** Cumulative upward scroll (px) before the band is revealed again. */
const REVEAL_THRESHOLD = spacing.sm;

/**
 * Orchestrates the recipe-list screen: data load with locale/focus refetch,
 * filter + sort state (applied and pending), paging, the mobile
 * collapsing-header scroll animation, and guest-gated save/create actions.
 *
 * @remarks
 * - **Stale answers** — rows reach the screen only while they answer the query
 *   being asked. Search is server-side, so on the first keystroke the store
 *   still holds the unfiltered feed; handing it over listed the whole catalogue
 *   as the match for one letter. It cuts the other way too: clearing the field
 *   showed the last query's hits as if they were the feed.
 * - **Loading is derived from data, not timers** — `isRefetching` asks "do the
 *   rows answer the current query", because the debounce settles during render
 *   while `load` only marks the store refreshing in the effect after it. Keying
 *   on the debounce window left one frame claiming to be idle with no rows,
 *   which flashed "no results" at the start of every search. A failed refresh
 *   is excluded or the spinner would never stop.
 * - **Pull-to-refresh** — `isPullRefreshing` tracks ONLY a user-initiated pull.
 *   Setting `RefreshControl.refreshing` programmatically calls
 *   `beginRefreshing` on iOS, which animates the list down and back: a visible
 *   jump on a filter tap.
 * - **Reloads that blank the rows** — a filter, sort, search or language change
 *   replaces what the list should contain, so the feed empties while the next
 *   set arrives; leaving the old rows up read as a second load, or as if the
 *   tap had done nothing. A pull and the silent focus refetch deliberately do
 *   not count.
 * - **Initial load carries the sort** — a bare `load()` falls back to the
 *   backend's `createdAt desc`, so the first paint and the focus refetch
 *   disagreed and the list reshuffled on the first return from a detail page.
 * - **`buildApiFilters` takes the query as an argument** rather than closing
 *   over it: its identity is a dependency of the focus and locale effects, and
 *   a callback changing on every debounced keystroke made those refire and
 *   issue a second, duplicate request.
 * - **Paging is offered only for current rows** — asking for page 2 of a query
 *   the user has typed past would append results nobody asked for.
 * - **Guest gating** — create and AI-generate are auth-only routes, so the tap
 *   is intercepted here; letting the auth guard bounce a guest lands them on a
 *   bare login screen with no explanation.
 */
export const useRecipeList = (): UseRecipeListResult => {
  const router = useRouter();
  const pathname = usePathname();
  const { recipeListStore, notificationsStore, savedRecipesStore, loadFavoritesUseCase, authStore } = useStores();
  const { isSaved, toggleSave } = useSaveRecipe();
  const userId = authStore((s) => (s.state.status === StoreStatus.Authenticated ? s.state.session.user.id : null));
  const { promptVisible, promptMessage, requestGate, closePrompt } = useGuestGate(userId);
  const onGoToSignIn = useCallback(() => {
    closePrompt();
    router.push(RoutePaths.loginWithRedirect(pathname) as Href);
  }, [closePrompt, pathname, router]);
  const onOpenCreate = useCallback(() => requestGate(() => router.push(RoutePaths.createRecipe)), [requestGate, router]);
  const { cuisineLabel } = useTaxonomyLabel();
  const unreadCount = notificationsStore((s) => s.unreadCount);
  const state = recipeListStore((s) => s.state);
  const load = recipeListStore((s) => s.load);
  const loadMore = recipeListStore((s) => s.loadMore);
  const { isWebShell, isExpanded, width, height } = useLayout();
  const { searchQuery: webSearchQuery, setSearchQuery: setWebSearchQuery } = useWebShellState();
  const reduceMotion = useReducedMotion();
  // Subscribe to locale so the screen re-renders (and reloads) on a language switch.
  const language = useLocale();

  const [search, setSearch] = useState(CharConstants.empty);

  // The assistant searches by opening this screen with `?q=`, the way a person
  // arrives from a link — so the query lands in the visible field and the user
  // watches the search they asked for, rather than results appearing from a
  // store nobody touched. Applied once per distinct query: re-applying on every
  // render would fight the user the moment they edited the box.
  const { q: queryParam } = useLocalSearchParams<{ q?: string }>();
  const appliedQuery = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (queryParam === undefined || queryParam === appliedQuery.current) return;
    appliedQuery.current = queryParam;
    // Both fields, because which one this screen READS depends on the shell —
    // and writing only its own left the assistant's search doing nothing at
    // all on the web, where the header's field is the one that counts. The
    // action chip said "searched" and the feed never moved.
    setSearch(queryParam);
    setWebSearchQuery(queryParam);
  }, [queryParam, setWebSearchQuery]);

  // Web takes the query from the shared app-header field, native from the in-header one.
  const effectiveSearch = isWebShell ? webSearchQuery : search;
  const trimmedSearch = effectiveSearch.trim();
  const debouncedSearch = useDebouncedValue(trimmedSearch, SEARCH_DEBOUNCE_MS);
  const isSearching = trimmedSearch.length > ValueConstants.zero;

  const scrollY = useSharedValue(ValueConstants.zero);
  const listRef = useAnimatedRef<Animated.FlatList<RecipeSummaryEntity>>();
  const headerTranslateY = useSharedValue(ValueConstants.zero);
  const insets = useSafeAreaInsets();
  const hiddenHeaderY = hiddenHeaderOffset(insets.top);
  const lastScrollY = useSharedValue(ValueConstants.zero);
  const headerHidden = useSharedValue(ValueConstants.zero);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      scrollY.value = y;
      if (reduceMotion) return;
      const delta = y - lastScrollY.value;
      if (y <= layoutSizes.homeHeaderMax) {
        if (headerHidden.value !== ValueConstants.zero) {
          headerHidden.value = ValueConstants.zero;
          headerTranslateY.value = withTiming(ValueConstants.zero, HEADER_TIMING);
        }
      } else if (delta > ValueConstants.zero && headerHidden.value !== ValueConstants.one) {
        headerHidden.value = ValueConstants.one;
        headerTranslateY.value = withTiming(hiddenHeaderY, HEADER_TIMING);
      } else if (delta < -REVEAL_THRESHOLD && headerHidden.value !== ValueConstants.zero) {
        headerHidden.value = ValueConstants.zero;
        headerTranslateY.value = withTiming(ValueConstants.zero, HEADER_TIMING);
      }
      lastScrollY.value = y;
    },
    // Snap the band to whichever edge is nearer when scrolling settles.
    onMomentumEnd: () => {
      if (reduceMotion) return;
      const hide = headerTranslateY.value < hiddenHeaderY / ValueConstants.two;
      headerHidden.value = hide ? ValueConstants.one : ValueConstants.zero;
      headerTranslateY.value = withTiming(hide ? hiddenHeaderY : ValueConstants.zero, HEADER_TIMING);
    },
    onEndDrag: () => {
      if (reduceMotion) return;
      const hide = headerTranslateY.value < hiddenHeaderY / ValueConstants.two;
      headerHidden.value = hide ? ValueConstants.one : ValueConstants.zero;
      headerTranslateY.value = withTiming(hide ? hiddenHeaderY : ValueConstants.zero, HEADER_TIMING);
    },
  });

  const gridColumns = useMemo<number>(() => {
    if (!isExpanded) return ValueConstants.one;
    const available = feedContentWidth(width);
    return Math.max(ValueConstants.one, Math.floor((available + GRID_GAP) / (RECIPE_CARD_MIN_WIDTH + GRID_GAP)));
  }, [isExpanded, width]);

  const [sortBy, setSortBy] = useState<SortKey>(SortKey.Popular);
  const [filters, setFilters] = useState<UiFilters>(emptyFilters);
  const [pendingFilters, setPendingFilters] = useState<UiFilters>(emptyFilters);
  const [pendingSort, setPendingSort] = useState<SortKey>(SortKey.Popular);
  const [sheetOpen, setSheetOpen] = useState<RecipeSheet | null>(null);

  // The grid card carries a Save bookmark, so the saved set must be populated
  // wherever the grid renders — which is now the iPad as well as the web.
  useEffect(() => {
    if (!isExpanded) return;
    void loadFavoritesUseCase.execute().then((result) => {
      if (result.ok) savedRecipesStore.getState().setSaved(result.value);
    });
  }, [isExpanded, loadFavoritesUseCase, savedRecipesStore]);

  const buildApiFilters = useCallback(
    (f: UiFilters, sort: SortKey, query: string): RecipeFilters => ({
      ...(query.length > ValueConstants.zero ? { search: query } : {}),
      ...(f.cuisines.length > ValueConstants.zero ? { cuisines: f.cuisines } : {}),
      ...(f.categories.length > ValueConstants.zero ? { categories: f.categories } : {}),
      ...(f.difficulties.length > ValueConstants.zero ? { difficulties: f.difficulties } : {}),
      ...(f.maxTime > ValueConstants.zero ? { maxTime: f.maxTime } : {}),
      sort: SORT_TO_FILTER[sort],
    }),
    [],
  );

  useEffect(() => {
    if (state.status === StoreStatus.Idle) void load(buildApiFilters(filters, sortBy, debouncedSearch));
  }, [state.status, load, buildApiFilters, filters, sortBy, debouncedSearch]);

  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const [pendingReloads, setPendingReloads] = useState(ValueConstants.zero);
  const reload = useCallback(
    async (next: RecipeFilters): Promise<void> => {
      setPendingReloads((n) => n + ValueConstants.one);
      try {
        await load(next);
      } finally {
        setPendingReloads((n) => n - ValueConstants.one);
      }
    },
    [load],
  );

  const onRefresh = useCallback(() => {
    setIsPullRefreshing(true);
    void (async () => {
      try {
        await load(buildApiFilters(filters, sortBy, debouncedSearch));
      } catch {
        // `load` folds failures into state; swallow anyway so nothing escapes unhandled.
      } finally {
        // Cleared unconditionally so the spinner can never stick.
        setIsPullRefreshing(false);
      }
    })();
  }, [load, filters, sortBy, debouncedSearch, buildApiFilters]);

  // Refs, so these effects see the latest values without re-running on them.
  const filtersRef = useRef(filters);
  const sortByRef = useRef(sortBy);
  const searchRef = useRef(debouncedSearch);
  filtersRef.current = filters;
  sortByRef.current = sortBy;
  searchRef.current = debouncedSearch;
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    void reload(buildApiFilters(filtersRef.current, sortByRef.current, searchRef.current));
  }, [language, reload, buildApiFilters]);

  // Skips the mount run: the idle-load effect above already issued that request.
  const didSearchRef = useRef(false);
  useEffect(() => {
    if (!didSearchRef.current) {
      didSearchRef.current = true;
      return;
    }
    void reload(buildApiFilters(filtersRef.current, sortByRef.current, debouncedSearch));
  }, [debouncedSearch, reload, buildApiFilters]);

  // Re-fetch quietly on focus so new/edited recipes appear; skip the mount focus.
  const didFocusRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!didFocusRef.current) {
        didFocusRef.current = true;
        return;
      }
      void load(buildApiFilters(filtersRef.current, sortByRef.current, searchRef.current));
    }, [load, buildApiFilters]),
  );

  useRefreshFailureToast(state.status === StoreStatus.Loaded ? state.refreshFailure : undefined);

  const onOpenRecipe = useCallback(
    (id: string) => router.push(RoutePaths.recipeDetail(id) as Href),
    [router],
  );

  const applyAndLoad = useCallback(
    (next: UiFilters): void => {
      setFilters(next);
      setPendingFilters(next);
      void reload(buildApiFilters(next, sortBy, debouncedSearch));
    },
    [reload, buildApiFilters, sortBy, debouncedSearch],
  );

  const onApplyFilters = (): void => {
    // On mobile the sheet owns sort; on web sort is separate so pendingSort mirrors sortBy.
    const nextSort = isWebShell ? sortBy : pendingSort;
    setFilters(pendingFilters);
    setSortBy(nextSort);
    setSheetOpen(null);
    void reload(buildApiFilters(pendingFilters, nextSort, debouncedSearch));
  };

  const onOpenFilter = (): void => {
    setPendingFilters(filters);
    setPendingSort(sortBy);
    setSheetOpen(RecipeSheet.Filter);
  };

  const onResetFilters = (): void => {
    setFilters(emptyFilters);
    setPendingFilters(emptyFilters);
    // Keep the active sort: resetting filters must not silently change ordering.
    void reload(buildApiFilters(emptyFilters, sortBy, debouncedSearch));
  };

  // Both fields, for the reason the `?q=` effect writes both: which one this
  // screen READS depends on the shell, and clearing only its own left the
  // query in place on web. The debounced-search effect above reloads on the
  // change, so this does not fetch for itself.
  const onClearSearch = (): void => {
    setSearch(CharConstants.empty);
    setWebSearchQuery(CharConstants.empty);
  };

  // Everything narrowing the feed, in ONE reload with the values it will end
  // up at. Clearing the query and resetting the filters separately fired two
  // fetches, and the first one — still carrying the old query — could land
  // second and leave the feed withholding rows that no longer answered it.
  const onClearAllFilters = (): void => {
    setFilters(emptyFilters);
    setPendingFilters(emptyFilters);
    onClearSearch();
    void reload(buildApiFilters(emptyFilters, sortBy, CharConstants.empty));
  };

  // The query the stored rows answer — empty for the feed and before any load.
  const answeredQuery = state.status === StoreStatus.Loaded ? state.query : CharConstants.empty;
  const answersCurrentQuery = answeredQuery === trimmedSearch;

  const recipes = useMemo(
    () => (state.status === StoreStatus.Loaded && answersCurrentQuery ? state.recipes : []),
    [state, answersCurrentQuery],
  );

  const hasRefreshFailure = state.status === StoreStatus.Loaded && state.refreshFailure !== undefined;
  // The window in which rows are withheld for not answering the current query.
  const isAwaitingAnswer = !answersCurrentQuery && !hasRefreshFailure;
  const isRefetching = isRecipeListRefreshing(state) || isAwaitingAnswer;
  const isReloadingResults = pendingReloads > ValueConstants.zero || isAwaitingAnswer;

  const isLoadingMore = state.status === StoreStatus.Loaded && state.isLoadingMore === true;
  const canLoadMore =
    state.status === StoreStatus.Loaded && state.hasMore && answersCurrentQuery && !isLoadingMore;
  const onEndReached = useCallback((): void => {
    if (!canLoadMore) return;
    void loadMore(buildApiFilters(filtersRef.current, sortByRef.current, searchRef.current));
  }, [canLoadMore, loadMore, buildApiFilters]);

  return {
    state,
    recipes,
    isWebShell,
    isExpanded,
    isSearching,
    isRefetching,
    isReloadingResults,
    isLoadingMore,
    onEndReached,
    activeFilterCount: mutate.countActiveFilters(filters),
    gridColumns,
    sortBy,
    filters,
    activeCuisineLabel: filters.cuisines.length > ValueConstants.zero ? cuisineLabel(filters.cuisines[ValueConstants.zero]).name : null,
    unreadCount,
    listRef,
    // A step is one viewport minus a sliver, so a line of the previous screen
    // stays visible — scrolling a whole screen away loses the reader's place,
    // which is exactly the complaint about page-down keys.
    onAssistantScroll: (direction: AssistantScrollDirectionType) => {
      const target = scrollTargetFor(direction, scrollY.value, height);
      listRef.current?.scrollToOffset({ offset: target, animated: true });
    },
    scrollY,
    headerTranslateY,
    reduceMotion,
    scrollHandler,
    search,
    onSearchChange: setSearch,
    isPullRefreshing,
    onRefresh,
    onOpenRecipe,
    onOpenCreate,
    onNotifications: () => router.push(RoutePaths.notifications),
    isSaved,
    onToggleSave: (id: string) => requestGate(() => void toggleSave(id), t().recipes.signInToSave),
    onChangeSort: (key: SortKey) => {
      setSortBy(key);
      void load(buildApiFilters(filters, key, debouncedSearch));
    },
    onToggleCuisineQuick: (cuisine: string) => applyAndLoad(mutate.toggleCuisineQuick(filters, cuisine)),
    onDifficultyChange: (d: Difficulty | null) => applyAndLoad(mutate.setDifficultyQuick(filters, d)),
    // Direct category / max-time setters, applied and loaded the same way the
    // quick cuisine chip is. The sheet reaches these through its pending copy;
    // the assistant asks for one change at a time and has no sheet to open.
    onToggleCategory: (c: string) => applyAndLoad(mutate.toggleCategory(filters, c)),
    onSetMaxTime: (minutes: number) => applyAndLoad(mutate.setMaxTime(filters, minutes)),
    onRemoveCategory: (c: string) => applyAndLoad(mutate.removeCategory(filters, c)),
    onRemoveDifficulty: (d: Difficulty) => applyAndLoad(mutate.removeDifficulty(filters, d)),
    onRemoveMaxTime: () => applyAndLoad(mutate.removeMaxTime(filters)),
    onResetFilters,
    onClearSearch,
    onClearAllFilters,
    sheetOpen,
    pendingFilters,
    pendingSort,
    onOpenFilter,
    onCloseSheet: () => setSheetOpen(null),
    onSelectPendingSort: setPendingSort,
    onTogglePendingCuisine: (c: string) => setPendingFilters((f) => mutate.toggleCuisine(f, c)),
    onTogglePendingCategory: (c: string) => setPendingFilters((f) => mutate.toggleCategory(f, c)),
    onTogglePendingDifficulty: (d: Difficulty) => setPendingFilters((f) => mutate.toggleDifficulty(f, d)),
    onSetPendingMaxTime: (m: number) => setPendingFilters((f) => mutate.setMaxTime(f, m)),
    onApplyFilters,
    promptVisible,
    promptMessage,
    onClosePrompt: closePrompt,
    onGoToSignIn,
  };
};
