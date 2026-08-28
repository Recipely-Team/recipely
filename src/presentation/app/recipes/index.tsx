import { useAssistantFeedActions } from '@presentation/app/recipes/hooks/use-assistant-feed-actions';
import { useMemo } from 'react';
import { StoreStatus } from '@application/store/store-status';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/screen-line';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useAssistantListRecipeActions } from '@presentation/base/hooks/assistant/actions/use-assistant-list-recipe-actions';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScroll } from '@presentation/base/hooks/assistant/actions/use-assistant-scroll';
import { recipeRoster } from '@presentation/base/hooks/assistant/args/recipe-roster';
import { useRecipeList } from '@presentation/app/recipes/hooks/use-recipe-list';
import { RecipeSheet } from '@presentation/app/recipes/model/recipe-sheet';
import { RecipeListBody } from '@presentation/app/recipes/body/recipe-list-body';
import { MobileFilterSheet } from '@presentation/app/recipes/sheets/mobile-filter-sheet';
import { WebFilterModal } from '@presentation/app/recipes/sheets/web-filter-modal';
import { SignInPromptSheet } from '@presentation/app/recipes/shared/sheets/sign-in-prompt-sheet';
import { countActiveFilters } from '@presentation/app/recipes/model/filtering/filter-mutations';
import { ValueConstants } from '@core/constants';

/** What the editorial hero renders: one featured recipe and two runners-up. */
const HERO_RECIPE_COUNT = 3;

export const RecipeListScreen = (): React.JSX.Element => {
  const { trendingRecipesStore } = useStores();
  const vm = useRecipeList();

  // Filtering and sorting by voice, registered by the screen that owns the
  // filters — everywhere else these answer `unavailable_here`.
  useAssistantFeedActions({
    filters: vm.filters,
    onToggleCuisineQuick: vm.onToggleCuisineQuick,
    onToggleCategory: vm.onToggleCategory,
    onDifficultyChange: vm.onDifficultyChange,
    onSetMaxTime: vm.onSetMaxTime,
    onRemoveCategory: vm.onRemoveCategory,
    onRemoveDifficulty: vm.onRemoveDifficulty,
    onRemoveMaxTime: vm.onRemoveMaxTime,
    onClearSearch: vm.onClearSearch,
    onClearAllFilters: vm.onClearAllFilters,
    onChangeSort: vm.onChangeSort,
  });
  useAssistantScroll(vm.onAssistantScroll);

  // The editorial hero reads its own store, so its three recipes were invisible
  // to the assistant: asked for "öne çıkanlardan üçüncüsü" it counted into the
  // grid instead and opened something else entirely. Published only while the
  // hero is actually rendered — the phone layout has none, and offering rows
  // the user cannot see is the same lie in the other direction.
  const trendingState = trendingRecipesStore((state) => state.state);
  const featured = useMemo<readonly RecipeSummaryEntity[]>(
    () =>
      vm.isExpanded && !vm.isSearching && trendingState.status === StoreStatus.Loaded
        ? trendingState.recipes.slice(ValueConstants.zero, HERO_RECIPE_COUNT)
        : [],
    [vm.isExpanded, vm.isSearching, trendingState],
  );

  // What is actually on the feed, so "the second one" and "is there anything
  // here?" are questions the model can answer instead of guess at. Two rosters,
  // separately labelled and numbered, because they are two lists on one screen.
  useAssistantScreenContent(() =>
    [
      ...(featured.length > ValueConstants.zero
        ? [recipeRoster('featured', featured.map((recipe) => recipe.name))]
        : []),
      recipeRoster('recipes', vm.recipes.map((recipe) => recipe.name)),
    ].join(SCREEN_PART_SEPARATOR),
  );
  // Saving, liking and deleting a row the user can see, by name or by position.
  // The grid comes FIRST so a bare "the second one" still counts into it, which
  // is what it means nine times in ten; the hero's three resolve by name.
  useAssistantListRecipeActions(useMemo(() => [...vm.recipes, ...featured], [vm.recipes, featured]));

  return (
    <>
      <RecipeListBody vm={vm} />

      {/* Mobile filter bottom sheet (web uses the centered WebFilterModal below). */}
      <MobileFilterSheet
        visible={!vm.isWebShell && vm.sheetOpen === RecipeSheet.Filter}
        activeFilterCount={vm.activeFilterCount}
        pendingFilters={vm.pendingFilters}
        pendingSort={vm.pendingSort}
        onSelectSort={vm.onSelectPendingSort}
        onToggleCuisine={vm.onTogglePendingCuisine}
        onToggleCategory={vm.onTogglePendingCategory}
        onToggleDifficulty={vm.onTogglePendingDifficulty}
        onSetMaxTime={vm.onSetPendingMaxTime}
        onApply={vm.onApplyFilters}
        onReset={vm.onResetFilters}
        onClose={vm.onCloseSheet}
      />

      {/* Web filter dialog — centered modal; mobile uses the bottom sheet above. */}
      <WebFilterModal
        visible={vm.isWebShell && vm.sheetOpen === RecipeSheet.Filter}
        pending={vm.pendingFilters}
        resultCount={vm.recipes.length}
        hasActiveFilters={countActiveFilters(vm.pendingFilters) > ValueConstants.zero}
        onToggleCuisine={vm.onTogglePendingCuisine}
        onToggleCategory={vm.onTogglePendingCategory}
        onToggleDifficulty={vm.onTogglePendingDifficulty}
        onSetMaxTime={vm.onSetPendingMaxTime}
        onApply={vm.onApplyFilters}
        onReset={vm.onResetFilters}
        onClose={vm.onCloseSheet}
      />

      <SignInPromptSheet
        visible={vm.promptVisible}
        onClose={vm.onClosePrompt}
        onSignIn={vm.onGoToSignIn}
        message={vm.promptMessage}
      />
    </>
  );
};

export default RecipeListScreen;
