import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { type Href, usePathname, useRouter } from 'expo-router';
import { ListConstants, scrollThrottleMs, RoutePaths } from '@presentation/base/constants';
import type { AssistantScrollDirectionType } from '@presentation/base/hooks/assistant/args/scrolling/assistant-scroll-direction';
import { RecipeSheet } from '@presentation/app/recipes/model/recipe-sheet';
import { scrollTargetFor } from '@presentation/base/hooks/assistant/args/scrolling/scroll-tuning';
import { moveScrollTo } from '@presentation/base/hooks/assistant/args/scrolling/move-scroll-to';
import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useSaveRecipe } from '@presentation/base/hooks/recipes/use-save-recipe';
import { SortKey } from '@presentation/app/recipes/model/sorting/sort-key';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useGuestGate } from '@presentation/base/hooks/auth/use-guest-gate';
import { isRecipeListRefreshing } from '@application/recipes/list/is-recipe-list-refreshing';
import type { UiFilters } from '@presentation/app/recipes/model/filtering/ui-filters';
import { emptyFilters } from '@presentation/app/recipes/model/filtering/ui-filter-defaults';
import * as mutate from '@presentation/app/recipes/model/filtering/filter-mutations';
import { toRecipeFilters } from '@presentation/app/recipes/model/filtering/to-recipe-filters';
import type { UseRecipeListResult } from '@presentation/app/recipes/model/use-recipe-list-result';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTranslations } from '@presentation/i18n';
import type { Difficulty } from '@domain/recipes/difficulty';
import { CharConstants } from '@core/constants';
import { useSignedInUserId } from '@presentation/base/hooks/auth/use-signed-in-user-id';
import { useFeedLoader } from '@presentation/app/recipes/hooks/use-feed-loader';
import { useFeedSearch } from '@presentation/app/recipes/hooks/use-feed-search';
import { useFeedGrid } from '@presentation/app/recipes/hooks/use-feed-grid';
import { useFeedHeaderScroll } from '@presentation/app/recipes/hooks/use-feed-header-scroll';

/** The handle any of the feed's five branches hands back; only this hook names it. */
type AssistantScrollHandleType = Parameters<AssistantScrollableProps['ref']>[0];

/**
 * The recipe-list screen's view-model: filters and sort (applied and pending),
 * what the rows are, paging, and guest-gated save/create actions. Loading,
 * search, the grid and the collapsing header are its parts
 * (`useFeedLoader`, `useFeedSearch`, `useFeedGrid`, `useFeedHeaderScroll`).
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
 * - **Reloads that blank the rows** — a filter, sort, search or language change
 *   replaces what the list should contain, so the feed empties while the next
 *   set arrives; leaving the old rows up read as a second load, or as if the
 *   tap had done nothing. A pull and the silent focus refetch deliberately do
 *   not count.
 * - **Paging is offered only for current rows** — asking for page 2 of a query
 *   the user has typed past would append results nobody asked for.
 * - **Guest gating** — create and AI-generate are auth-only routes, so the tap
 *   is intercepted here; letting the auth guard bounce a guest lands them on a
 *   bare login screen with no explanation.
 */
export const useRecipeList = (): UseRecipeListResult => {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { savedRecipesStore, loadFavoritesUseCase } = useStores();
  const { toggleSave } = useSaveRecipe();
  const userId = useSignedInUserId();
  const { promptVisible, promptMessage, requestGate, closePrompt } = useGuestGate(userId);
  const { cuisineLabel } = useTaxonomyLabel();
  const { isWebShell, isExpanded, width, height } = useLayout();
  const shouldReduceMotion = useReducedMotion();

  const [sortBy, setSortBy] = useState<SortKey>(SortKey.Popular);
  const [filters, setFilters] = useState<UiFilters>(emptyFilters);
  const [pendingFilters, setPendingFilters] = useState<UiFilters>(emptyFilters);
  const [pendingSort, setPendingSort] = useState<SortKey>(SortKey.Popular);
  const [sheetOpen, setSheetOpen] = useState<RecipeSheet | null>(null);

  const search = useFeedSearch(isWebShell);
  const { debouncedSearch } = search;
  const { state, load, reload, loadMore, onRefresh, isPullRefreshing, isReloading } = useFeedLoader({ filters, sortBy, debouncedSearch });
  const { gridColumns, gridCellMaxWidth } = useFeedGrid(isExpanded, width);
  const { scrollY, headerTranslateY, scrollHandler } = useFeedHeaderScroll(shouldReduceMotion);
  // A plain ref of the shared handle shape, so every feed branch can attach to it.
  const listRef = useRef<AssistantScrollHandleType>(null);

  // The grid card shows a Save bookmark, so load the signed-in viewer's saved set wherever the grid renders.
  useEffect(() => {
    if (!isExpanded || userId === null) return;
    void loadFavoritesUseCase.execute().then((result) => {
      if (result.ok) savedRecipesStore.getState().setSaved(result.value);
    });
  }, [isExpanded, userId, loadFavoritesUseCase, savedRecipesStore]);

  // Stable, so the memoised cards do not re-render when the page does.
  const onToggleSave = useCallback(
    (id: string) => requestGate(() => void toggleSave(id), t.recipes.signInToSave),
    [requestGate, toggleSave, t],
  );
  const onOpenRecipe = useCallback((id: string) => router.push(RoutePaths.recipeDetail(id) as Href), [router]);

  const applyAndLoad = (next: UiFilters): void => {
    setFilters(next);
    setPendingFilters(next);
    void reload(toRecipeFilters(next, sortBy, debouncedSearch));
  };
  const onApplyFilters = (): void => {
    // On mobile the sheet owns sort; on web sort is separate so pendingSort mirrors sortBy.
    const nextSort = isWebShell ? sortBy : pendingSort;
    setFilters(pendingFilters);
    setSortBy(nextSort);
    setSheetOpen(null);
    void reload(toRecipeFilters(pendingFilters, nextSort, debouncedSearch));
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
    void reload(toRecipeFilters(emptyFilters, sortBy, debouncedSearch));
  };
  // Everything narrowing the feed in ONE reload, so a stale request cannot land last.
  const onClearAllFilters = (): void => {
    setFilters(emptyFilters);
    setPendingFilters(emptyFilters);
    search.clearSearch();
    void reload(toRecipeFilters(emptyFilters, sortBy, CharConstants.empty));
  };

  // The query the stored rows answer — empty for the feed and before any load.
  const answeredQuery = state.status === StoreStatus.Loaded ? state.query : CharConstants.empty;
  const doesAnswerCurrentQuery = answeredQuery === search.trimmedSearch;
  const recipes = useMemo(
    () => (state.status === StoreStatus.Loaded && doesAnswerCurrentQuery ? state.recipes : []),
    [state, doesAnswerCurrentQuery],
  );
  const hasRefreshFailure = state.status === StoreStatus.Loaded && state.refreshFailure !== undefined;
  // The window in which rows are withheld for not answering the current query.
  const isAwaitingAnswer = !doesAnswerCurrentQuery && !hasRefreshFailure;
  const isLoadingMore = state.status === StoreStatus.Loaded && state.isLoadingMore === true;
  const canLoadMore = state.status === StoreStatus.Loaded && state.hasMore && doesAnswerCurrentQuery && !isLoadingMore;
  const onEndReached = (): void => {
    if (canLoadMore) void loadMore(toRecipeFilters(filters, sortBy, debouncedSearch));
  };
  const [firstCuisine] = filters.cuisines;

  return {
    state,
    recipes,
    isWebShell,
    isExpanded,
    isSearching: search.isSearching,
    isRefetching: isRecipeListRefreshing(state) || isAwaitingAnswer,
    isReloadingResults: isReloading || isAwaitingAnswer,
    isLoadingMore,
    hasMore: state.status === StoreStatus.Loaded && state.hasMore,
    onEndReached,
    activeFilterCount: mutate.countActiveFilters(filters),
    gridColumns,
    gridCellMaxWidth,
    sortBy,
    filters,
    activeCuisineLabel: firstCuisine === undefined ? null : cuisineLabel(firstCuisine).name,
    // A callback ref (each branch attaches a different list class) bundled with onScroll so neither is forgotten.
    assistantScroll: {
      ref: (instance: AssistantScrollHandleType): void => {
        listRef.current = instance;
      },
      onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        scrollY.set(contentOffset.y);
        // The wide grid is nested in this ScrollView, so this scroll asks for the next page.
        const remaining = contentSize.height - (contentOffset.y + layoutMeasurement.height);
        if (remaining <= layoutMeasurement.height * ListConstants.endReachedThreshold) onEndReached();
      },
      // Coarse: only the assistant reads this.
      scrollEventThrottle: scrollThrottleMs.coarse,
    },
    attachList: (instance: AssistantScrollHandleType): void => {
      listRef.current = instance;
    },
    // One viewport minus a sliver, so the reader keeps their place.
    onAssistantScroll: (direction: AssistantScrollDirectionType): boolean =>
      moveScrollTo(listRef.current, scrollTargetFor(direction, scrollY.get(), height)),
    scrollY,
    headerTranslateY,
    reduceMotion: shouldReduceMotion,
    scrollHandler,
    search: search.search,
    onSearchChange: search.setSearch,
    isPullRefreshing,
    onRefresh,
    onOpenRecipe,
    onOpenCreate: () => requestGate(() => router.push(RoutePaths.createRecipe)),
    searchedQuery: debouncedSearch,
    onCreateWithAi: (query: string) =>
      requestGate(() => router.push({ pathname: RoutePaths.createRecipe, params: { prompt: query } })),
    onToggleSave,
    onChangeSort: (key: SortKey) => {
      setSortBy(key);
      void load(toRecipeFilters(filters, key, debouncedSearch));
    },
    onToggleCuisineQuick: (cuisine: string) => applyAndLoad(mutate.toggleCuisineQuick(filters, cuisine)),
    onDifficultyChange: (d: Difficulty | null) => applyAndLoad(mutate.setDifficultyQuick(filters, d)),
    // Direct setters for the assistant, applied like the quick cuisine chip.
    onToggleCategory: (c: string) => applyAndLoad(mutate.toggleCategory(filters, c)),
    onSetMaxTime: (minutes: number) => applyAndLoad(mutate.setMaxTime(filters, minutes)),
    onRemoveCategory: (c: string) => applyAndLoad(mutate.removeCategory(filters, c)),
    onRemoveDifficulty: (d: Difficulty) => applyAndLoad(mutate.removeDifficulty(filters, d)),
    onRemoveMaxTime: () => applyAndLoad(mutate.removeMaxTime(filters)),
    onResetFilters,
    onClearSearch: search.clearSearch,
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
    onGoToSignIn: () => {
      closePrompt();
      router.push(RoutePaths.loginWithRedirect(pathname) as Href);
    },
  };
};
