import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StoreStatus } from '@application/store/store-status';
import { CharConstants, ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { PageTitle } from '@presentation/base/widgets/head/page-title';
import { ConfirmSheet } from '@presentation/base/widgets/sheets/confirm-sheet';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { AutomationsBar } from '@presentation/app/automations/shared/items/automations-bar';
import { useRuleEditor } from '@presentation/app/automations/edit/hooks/use-rule-editor';
import { EditorStep } from '@presentation/app/automations/edit/model/editor-step';
import { editorStepLabels } from '@presentation/app/automations/edit/model/editor-step-labels';
import { EditorProgress } from '@presentation/app/automations/edit/body/editor-progress';
import { EditorStepper } from '@presentation/app/automations/edit/body/editor-stepper';
import { EditorFooter } from '@presentation/app/automations/edit/body/editor-footer';
import { PostStep } from '@presentation/app/automations/edit/body/post-step';
import { KeywordsStep } from '@presentation/app/automations/edit/body/keywords-step';
import { RecipeStep } from '@presentation/app/automations/edit/body/recipe-step';
import { MessageStep } from '@presentation/app/automations/edit/body/message-step';
import { spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

/**
 * The automation editor (spec §3): Post → Keywords → Recipe → Message, a
 * progress bar on a phone and a stepper once expanded, Next gated by each
 * step, Save on the last.
 */
export const AutomationEditScreen = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const { isExpanded } = useLayout();
  const vm = useRuleEditor();
  const scrollable = useAssistantScrollable();
  const { instagramStore } = useStores();
  const handle = instagramStore((s) => (s.connection.status === StoreStatus.Loaded ? s.connection.connection.displayHandle : CharConstants.empty));
  const copy = t().instagram;
  const title = vm.isEdit ? copy.editAutomation : copy.newAutomation;
  const subtitle = copy.stepOf.replace('{n}', String(vm.step + ValueConstants.one)).replace('{s}', editorStepLabels()[vm.step] ?? CharConstants.empty);

  const step = (): React.JSX.Element => {
    switch (vm.step) {
      case EditorStep.Post:
        return <PostStep scrollable={scrollable} handle={handle} selected={vm.mediaId} onSelect={vm.setMedia} />;
      case EditorStep.Keywords:
        return (
          <KeywordsStep
            scrollable={scrollable}
            keywords={vm.keywords}
            input={vm.keywordInput}
            error={vm.keywordError}
            onInput={vm.setKeywordInput}
            onAdd={vm.addKeyword}
            onRemove={vm.removeKeyword}
          />
        );
      case EditorStep.Recipe:
        return <RecipeStep scrollable={scrollable} selected={vm.recipeId} onSelect={vm.setRecipe} />;
      case EditorStep.Message:
        return (
          <MessageStep
            scrollable={scrollable}
            handle={handle}
            dmText={vm.dmText}
            replyOn={vm.replyOn}
            replyText={vm.replyText}
            recipeName={vm.recipeName}
            recipeImage={vm.recipeImage}
            isEdit={vm.isEdit}
            onDmText={vm.setDmText}
            onReplyOn={vm.setReplyOn}
            onReplyText={vm.setReplyText}
            onDelete={vm.openDelete}
          />
        );
    }
  };

  const isLast = vm.step === EditorStep.Message;
  return (
    <KeyboardAvoider style={[styles.screen, { backgroundColor: colors.background }]}>
      <PageTitle subject={title} />
      <AutomationsBar title={title} subtitle={subtitle} icon="close" onBack={vm.close} />
      {isExpanded ? null : <EditorProgress step={vm.step} />}
      <View style={[styles.body, isExpanded ? styles.row : null]}>
        {isExpanded ? <EditorStepper step={vm.step} stepValid={vm.stepValid} onGoTo={vm.goTo} /> : null}
        <View style={styles.step}>{vm.isLoading ? <ActivityIndicator color={colors.primary} /> : step()}</View>
      </View>
      <EditorFooter
        isLast={isLast}
        canContinue={vm.stepValid[vm.step] === true && !vm.isLoading}
        isSaving={vm.isSaving}
        onBack={vm.back}
        onNext={isLast ? vm.save : vm.next}
      />
      <ConfirmSheet
        visible={vm.isDeleteOpen}
        title={copy.deleteRule}
        message={copy.deleteQ}
        confirmLabel={copy.deleteRule}
        destructive
        loading={vm.isSaving}
        onConfirm={vm.confirmDelete}
        onClose={vm.closeDelete}
      />
    </KeyboardAvoider>
  );
};

export default AutomationEditScreen;

const styles = StyleSheet.create({
  screen: { flex: ValueConstants.one },
  body: { flex: ValueConstants.one, width: '100%', maxWidth: AutomationMetrics.pageMaxWidth, alignSelf: 'center', padding: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.xl },
  step: { flex: ValueConstants.one },
});
