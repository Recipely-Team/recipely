import type { SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import type { UiFilters } from '@presentation/app/recipes/model/ui-filters';
import type { SortKey } from '@presentation/app/recipes/model/sort-key';
import type { RecipeListState } from '@application/recipes/list/recipe-list-state';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { Difficulty } from '@domain/recipes/difficulty';

/** View model returned by {@link useRecipeList} for the recipe-list screen. */
export interface UseRecipeListResult {
  state: RecipeListState;
  filteredRecipes: RecipeSummaryEntity[];
  isWebShell: boolean;
  isSearching: boolean;
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

  // Search (mobile local search field).
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
