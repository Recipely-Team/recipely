import { useAssistantFeedActions } from '@presentation/app/recipes/hooks/use-assistant-feed-actions';
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

export const RecipeListScreen = (): React.JSX.Element => {
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
  // What is actually on the feed, so "the second one" and "is there anything
  // here?" are questions the model can answer instead of guess at.
  useAssistantScreenContent(() => recipeRoster('recipes', vm.recipes.map((recipe) => recipe.name)));
  // Saving, liking and deleting a row the user can see, by name or by position.
  useAssistantListRecipeActions(vm.recipes);

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
