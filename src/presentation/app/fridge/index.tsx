import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useGoBackOrHome } from '@presentation/base/hooks/navigation/use-go-back-or-home';
import { PageTitle } from '@presentation/base/widgets/head/page-title';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { RoutePaths } from '@presentation/base/constants';
import { PickSource } from '@presentation/base/utils/pick-source';
import { FridgeHeader } from '@presentation/app/fridge/body/fridge-header';
import { CaptureStep } from '@presentation/app/fridge/body/capture-step';
import { AnalysingStep } from '@presentation/app/fridge/body/analysing-step';
import { IngredientsStep } from '@presentation/app/fridge/body/ingredients-step';
import { IdeasStep } from '@presentation/app/fridge/body/ideas-step';
import { FridgeMessageState } from '@presentation/app/fridge/body/fridge-message-state';
import { FridgeFooter } from '@presentation/app/fridge/body/fridge-footer';
import { useFridgeFlow } from '@presentation/app/fridge/hooks/use-fridge-flow';
import { useFridgeIdeaActions } from '@presentation/app/fridge/hooks/use-fridge-idea-actions';
import { FridgeStep } from '@presentation/app/fridge/model/flow/fridge-step';
import { FridgeProgress } from '@presentation/app/fridge/model/flow/fridge-progress';
import { spacing } from '@presentation/base/theme';
import { WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/**
 * Cook from my fridge (design spec → Cook from my fridge): photos →
 * ingredients → ideas, then an idea opens the ordinary AI create flow.
 *
 * @remarks
 * - **Composition only**: the flow's state is `useFridgeFlow`, what an idea
 *   leads to is `useFridgeIdeaActions`, and each step is its own body.
 * - **Back walks the steps**; on step 1 and the full-screen states it closes
 *   the flow (to the AI create screen when there is nothing to go back to).
 * - **Reading width**: 560, the ideas grid 920 on a wide window.
 */
export const FridgeScreen = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isExpanded, isWebShell } = useLayout();
  const flow = useFridgeFlow();
  const scrollable = useAssistantScrollable();
  const close = useGoBackOrHome(RoutePaths.createRecipe);
  const { state } = flow;
  const { view } = state;
  const ideas = useFridgeIdeaActions(view.step === FridgeStep.Ideas ? view.query : null);
  const strings = t().fridge;
  const isClose = view.step === FridgeStep.Capture || view.step === FridgeStep.NothingFound || view.step === FridgeStep.Limit;
  const onBack = view.step === FridgeStep.Analysing ? flow.cancelScan : isClose ? close : flow.back;
  const maxWidth = view.step === FridgeStep.Ideas && isExpanded ? WEB_CONTENT_MAX_WIDTH.fridgeIdeas : WEB_CONTENT_MAX_WIDTH.fridge;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: isWebShell ? ValueConstants.zero : insets.top }]}>
      <PageTitle subject={strings.title} />
      <FridgeHeader step={FridgeProgress.numberOf(view.step)} isClose={isClose} onBack={onBack} />
      <KeyboardAvoider style={styles.root}>
        <ScrollView {...scrollable} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.column, { maxWidth }]}>
            {view.step === FridgeStep.Capture ? (
              <CaptureStep
                photos={state.photos}
                failure={view.failure}
                canUseCamera={Platform.OS !== 'web'}
                onTakePhoto={() => void flow.addPhotos(PickSource.Camera)}
                onChoosePhotos={() => void flow.addPhotos(PickSource.Library)}
                onRemovePhoto={flow.removePhoto}
              />
            ) : null}
            {view.step === FridgeStep.Analysing ? <AnalysingStep photos={state.photos} /> : null}
            {view.step === FridgeStep.Ingredients ? (
              <IngredientsStep
                chips={state.chips}
                source={state.source}
                filters={state.filters}
                failure={view.failure}
                startAdding={view.startAdding}
                dense={isExpanded}
                onRemoveChip={flow.removeChip}
                onAddChip={flow.addChip}
                onChangeFilters={flow.changeFilters}
              />
            ) : null}
            {view.step === FridgeStep.Ideas ? (
              <IdeasStep
                query={view.query}
                ideas={view.ideas}
                load={view.load}
                added={view.added}
                grid={isExpanded}
                onEdit={flow.back}
                onCook={ideas.cook}
                onAddMissing={(idea) => void ideas.addMissing(idea).then((added) => (added ? flow.markAdded(idea.title) : undefined))}
                onShowMore={flow.showMore}
                onClearFilters={flow.clearFiltersAndRetry}
              />
            ) : null}
            {view.step === FridgeStep.NothingFound ? (
              <FridgeMessageState
                icon="camera-outline"
                title={strings.noneTitle}
                body={strings.noneBody}
                primaryLabel={strings.retake}
                onPrimary={flow.retake}
                secondaryLabel={strings.typeInstead}
                onSecondary={flow.typeInstead}
              />
            ) : null}
            {view.step === FridgeStep.Limit ? (
              <FridgeMessageState
                icon="sparkles-outline"
                title={strings.limitTitle}
                body={strings.limitBody}
                primaryLabel={strings.browseRecipes}
                onPrimary={() => router.replace(RoutePaths.recipes)}
                secondaryLabel={t().common.back}
                onSecondary={close}
              />
            ) : null}
          </View>
        </ScrollView>
        <FridgeFooter state={state} onFindIngredients={() => void flow.findIngredients()} onCancel={flow.cancelScan} onShowIdeas={flow.showIdeas} />
      </KeyboardAvoider>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: ValueConstants.one },
  content: { paddingTop: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  column: { width: '100%', alignSelf: 'center' },
});

export default FridgeScreen;
