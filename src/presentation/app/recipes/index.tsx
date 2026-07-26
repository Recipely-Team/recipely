import { useRecipeList } from '@presentation/app/recipes/hooks/use-recipe-list';
import { RecipeListBody } from '@presentation/app/recipes/body/recipe-list-body';
import { MobileFilterSheet } from '@presentation/app/recipes/sheets/mobile-filter-sheet';
import { WebFilterModal } from '@presentation/app/recipes/sheets/web-filter-modal';
import { SignInPromptSheet } from '@presentation/app/recipes/shared/sheets/sign-in-prompt-sheet';
import { countActiveFilters } from '@presentation/app/recipes/model/filter-mutations';
import { ValueConstants } from '@core/constants';

export const RecipeListScreen = (): React.JSX.Element => {
  const vm = useRecipeList();

  return (
    <>
      <RecipeListBody vm={vm} />

      {/* Mobile filter bottom sheet (web uses the centered WebFilterModal below). */}
      <MobileFilterSheet
        visible={!vm.isWebShell && vm.sheetOpen === 'filter'}
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
        visible={vm.isWebShell && vm.sheetOpen === 'filter'}
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
