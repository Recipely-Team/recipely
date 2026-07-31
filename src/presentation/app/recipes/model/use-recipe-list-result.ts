import type { SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import type { UiFilters } from '@presentation/app/recipes/model/ui-filters';
import { SortKey } from '@presentation/app/recipes/model/sort-key';
import type { RecipeListState } from '@application/recipes/list/recipe-list-state';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { Difficulty } from '@domain/recipes/difficulty';

/** View model returned by {@link useRecipeList} for the recipe-list screen. */
export interface UseRecipeListResult {
  state: RecipeListState;
  /**
   * The rows to render. Already narrowed by the backend — filters AND the
   * search query are query params, so there is no client-side pass over this.
   */
  recipes: RecipeSummaryEntity[];
  isWebShell: boolean;
  isSearching: boolean;
  /**
   * True whenever the visible rows are out of date with what the user has
   * asked for: a filter/sort/search refetch is in flight, OR a typed query is
   * still waiting out its debounce. Drives the feed's inline "Refreshing…"
   * indicator, which is what makes a filter tap read as a server round trip
   * rather than a dead press. Distinct from `isPullRefreshing`, which is the
   * pull gesture alone.
   */
  isRefetching: boolean;
  /**
   * True while a load that changes WHAT the list should contain is in flight —
   * a filter, sort, search or language change. The feed replaces its rows with
   * a loading placeholder for exactly these: keeping the previous results up
   * while the next set arrives read as the list loading twice.
   *
   * A pull-to-refresh (`isPullRefreshing`) and the silent focus refetch are
   * deliberately excluded — the first needs its rows to stay under the finger
   * that is pulling them, the second re-fetches what the user already sees.
   */
  isReloadingResults: boolean;
  /** True while the NEXT page is being appended below the current rows. */
  isLoadingMore: boolean;
  /** Called when the feed nears its end; appends the next page if there is one. */
  onEndReached: () => void;
  activeFilterCount: number;
  gridColumns: number;
  sortBy: SortKey;
  filters: UiFilters;
  activeCuisineLabel: string | null;
  unreadCount: number;

  // Mobile collapsing-header scroll state.
  scrollY: SharedValue<number>;
  headerTranslateY: SharedValue<number>;
  reduceMotion: boolean;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;

  // Search (mobile in-header field; web reads the shared app-header one).
  // Raw, un-debounced value so the input stays responsive per keystroke.
  search: string;
  onSearchChange: (value: string) => void;

  /**
   * True while a refetch the user explicitly asked for — a pull-to-refresh or a
   * retry button, i.e. anything routed through `onRefresh` — is in flight.
   * Refetches the user didn't ask for (filter, sort, locale, focus) leave it
   * false. Drives the mobile `RefreshControl`: on iOS a programmatic
   * `refreshing` animates the scroll view down and back, so a filter tap would
   * read as an unexplained jump. For "is the list refetching at all" use
   * `isRecipeListRefreshing` on `state` instead.
   */
  isPullRefreshing: boolean;

  // Navigation + list actions.
  onRefresh: () => void;
  onOpenRecipe: (id: string) => void;
  onOpenCreate: () => void;
  onNotifications: () => void;
  isSaved: (id: string) => boolean;
  onToggleSave: (id: string) => void;
  onChangeSort: (key: SortKey) => void;

  // Applied-filter quick actions (web grid + mobile chips).
  onToggleCuisineQuick: (cuisine: string) => void;
  onDifficultyChange: (difficulty: Difficulty | null) => void;
  onRemoveCategory: (category: string) => void;
  onRemoveDifficulty: (difficulty: Difficulty) => void;
  onRemoveMaxTime: () => void;
  onResetFilters: () => void;

  // Filter sheet / modal state + pending edits.
  sheetOpen: 'filter' | null;
  pendingFilters: UiFilters;
  pendingSort: SortKey;
  onOpenFilter: () => void;
  onCloseSheet: () => void;
  onSelectPendingSort: (key: SortKey) => void;
  onTogglePendingCuisine: (cuisine: string) => void;
  onTogglePendingCategory: (category: string) => void;
  onTogglePendingDifficulty: (difficulty: Difficulty) => void;
  onSetPendingMaxTime: (minutes: number) => void;
  onApplyFilters: () => void;

  // Guest sign-in prompt.
  promptVisible: boolean;
  promptMessage: string | undefined;
  onClosePrompt: () => void;
  onGoToSignIn: () => void;
}
