import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageTitle } from '@presentation/base/widgets/head/page-title';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing } from '@presentation/base/theme';
import { useReportFailure } from '@presentation/base/errors/use-report-failure';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { StateView } from '@presentation/app/recipes/[recipeId]/items/state-view';
import { StateViewStatus } from '@presentation/app/recipes/[recipeId]/model/state-view-status';
import { CookTopBar } from '@presentation/app/recipes/[recipeId]/cook/body/cook-top-bar';
import { CookStepPane } from '@presentation/app/recipes/[recipeId]/cook/body/cook-step-pane';
import { CookControls } from '@presentation/app/recipes/[recipeId]/cook/body/cook-controls';
import { CookProgressBar } from '@presentation/app/recipes/[recipeId]/cook/items/cook-progress-bar';
import { CookIngredientsSheet } from '@presentation/app/recipes/[recipeId]/cook/sheets/cook-ingredients-sheet';
import { useCookMode } from '@presentation/app/recipes/[recipeId]/cook/hooks/use-cook-mode';
import { useCookModeAssistant } from '@presentation/app/recipes/[recipeId]/cook/hooks/use-cook-mode-assistant';
import { useKeepAwakeWhileFocused } from '@presentation/app/recipes/[recipeId]/cook/hooks/use-keep-awake-while-focused';
import { CookRecipeStatus } from '@presentation/app/recipes/[recipeId]/cook/model/cook-recipe-status';
import { cookModeSizes } from '@presentation/app/recipes/[recipeId]/cook/model/cook-mode-sizes';

/** The shared state view's status for each of cook mode's recipe states. */
const VIEW_STATUS = {
  [CookRecipeStatus.Loading]: StateViewStatus.Loading,
  [CookRecipeStatus.Error]: StateViewStatus.Error,
  [CookRecipeStatus.Empty]: StateViewStatus.Empty,
  [CookRecipeStatus.Ready]: StateViewStatus.Content,
} as const;

/**
 * Cook mode: a recipe's steps one at a time, full screen, with the screen kept
 * awake while it is in front.
 *
 * @remarks
 * - **Composition only.** The recipe, the step cursor and the ticks are
 *   `useCookMode`; voice is `useCookModeAssistant`; the wake lock is
 *   `useKeepAwakeWhileFocused`.
 * - **A centred reading column** (`cookModeSizes.columnMaxWidth`) on a tablet
 *   or a desktop; the full width on a phone.
 * - **Safe-area insets only off the web shell**, which has no notch to clear.
 */
export const CookModeScreen = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isWebShell } = useLayout();
  const vm = useCookMode();
  useKeepAwakeWhileFocused();
  useCookModeAssistant(vm);
  const { state, navigation } = vm;
  useReportFailure(state.status === CookRecipeStatus.Error ? state.failure : null, 'CookModeScreen');

  const padding = isWebShell
    ? { paddingTop: spacing.lg, paddingBottom: spacing.lg }
    : { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md };

  return (
    <View style={[styles.root, padding, { backgroundColor: colors.background }]}>
      <PageTitle subject={vm.recipeName.length > ValueConstants.zero ? vm.recipeName : undefined} />
      <View style={styles.column}>
        <CookTopBar
          recipeName={vm.recipeName}
          onExit={vm.onExit}
          onOpenIngredients={vm.openIngredients}
          hasIngredients={vm.ingredients.length > ValueConstants.zero}
        />
        <StateView
          status={VIEW_STATUS[state.status]}
          failure={state.status === CookRecipeStatus.Error ? state.failure : undefined}
          onRetry={state.status === CookRecipeStatus.Error ? vm.onRetry : undefined}
          emptyMessage={t().cookMode.noSteps}
          emptyIcon="restaurant-outline"
        >
          <View style={styles.body}>
            <CookProgressBar index={navigation.index} total={vm.steps.length} />
            <CookStepPane
              recipeId={vm.recipeId}
              recipeName={vm.recipeName}
              step={vm.currentStep}
              index={navigation.index}
              total={vm.steps.length}
              isDone={vm.completedSteps[navigation.index] === true}
              onToggleDone={() => vm.onToggleStep(navigation.index)}
              minutes={vm.stepMinutes}
              onSwipe={vm.onSwipe}
            />
            <CookControls
              isFirst={navigation.isFirst}
              isLast={navigation.isLast}
              onPrevious={vm.onPrevious}
              onNext={vm.onNext}
            />
          </View>
        </StateView>
      </View>
      <CookIngredientsSheet visible={vm.isIngredientsOpen} ingredients={vm.ingredients} onClose={vm.closeIngredients} />
    </View>
  );
};

export default CookModeScreen;

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
    paddingHorizontal: spacing.lg,
  },
  column: {
    flex: ValueConstants.one,
    width: '100%',
    maxWidth: cookModeSizes.columnMaxWidth,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  body: {
    flex: ValueConstants.one,
    gap: spacing.xl,
  },
});
