import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { useAssistantConfirmation } from '@presentation/base/hooks/assistant/actions/use-assistant-confirmation';
import { useAssistantDraftActions } from '@presentation/app/create-recipe/hooks/use-assistant-draft-actions';
import { useAssistantExitActions } from '@presentation/app/create-recipe/hooks/use-assistant-exit-actions';
import { useCreateRecipe } from '@presentation/app/create-recipe/hooks/use-create-recipe';
import { PhaseType } from '@presentation/app/create-recipe/model/phase-type';
import { assistantSheetGates } from '@presentation/app/create-recipe/model/assistant-sheet-gates';
import { PromptPhase } from '@presentation/app/create-recipe/body/prompt-phase';
import { GeneratingView } from '@presentation/app/create-recipe/body/generating-view';
import { ResumingView } from '@presentation/app/create-recipe/body/resuming-view';
import { CreateRecipePreview } from '@presentation/app/create-recipe/body/create-recipe-preview';
import { PhotosSheet } from '@presentation/app/create-recipe/sheets/photos-sheet';
import { ExitSheet } from '@presentation/app/create-recipe/sheets/exit-sheet';
import { ConfirmSheet } from '@presentation/base/widgets/sheets/confirm-sheet';
import { FeedbackDialog } from '@presentation/base/widgets/dialogs/feedback-dialog';
import { CharConstants, ValueConstants } from '@core/constants';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';

export const CreateRecipeScreen = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const vm = useCreateRecipe();
  // Only the assistant's publish is confirmed here (speech may be misheard).
  const [assistantPublishOpen, setAssistantPublishOpen] = useState(false);
  // Sheets live in the preview phase only, so confirmations are gated on it.
  const isPreview = vm.phase === PhaseType.Preview;
  // Which sheet owns the spoken yes/no — derived and tested in one place.
  const { exitOrErrorOpen, canLeave, isExitPending } = assistantSheetGates({
    exitOpen: vm.exitOpen,
    publishOpen: assistantPublishOpen,
    saveErrorOpen: vm.saveError !== null,
    saveIssueOpen: vm.saveIssue !== null,
    photosOpen: vm.photosOpen,
  });

  useAssistantExitActions({
    canLeave,
    isExitPending,
    onClose: vm.onClose,
    onSaveDraftAndExit: vm.onSaveDraftAndExit,
    onDiscardAndExit: vm.onDiscardAndExit,
  });
  useAssistantDraftActions({
    onGenerateAnother: vm.onGenerateAnother,
    isDraftVisible: isPreview,
    isPromptVisible: vm.phase === PhaseType.Prompt,
    // The exit sheet's save (keep and leave) wins while it is open.
    isExitPending,
    // Tell the model which rejection the user is reading.
    saveProblem: vm.saveError ?? vm.saveIssue,
    resumableDraft: vm.latestDraft,
    onResumeDraft: vm.onResumeDraft,
    recipe: vm.recipe,
    onUpdateField: vm.onUpdateField,
    onAppendIngredient: vm.onAppendIngredient,
    onRemoveIngredient: vm.onRemoveIngredient,
    onAppendStep: vm.onAppendStep,
    onRemoveStep: vm.onRemoveStep,
    onOpenPhotos: vm.onOpenPhotos,
    onSubmitRefine: vm.onSubmitRefine,
    onRegenerate: vm.onRegenerate,
    onRequestPublish: () => setAssistantPublishOpen(true),
  });
  useAssistantConfirmation(
    isPreview && assistantPublishOpen && !exitOrErrorOpen,
    () => {
      setAssistantPublishOpen(false);
      vm.onSaveAndPublish();
    },
    () => setAssistantPublishOpen(false),
  );
  // One confirmation at a time: the publish modal owns the spoken yes while open.
  useAssistantConfirmation(
    isPreview && vm.proposal !== null && !assistantPublishOpen && !exitOrErrorOpen,
    vm.onAcceptProposal,
    vm.onRejectProposal,
  );

  if (vm.phase === PhaseType.Prompt) {
    return (
      <KeyboardAvoider style={styles.root}>
        <ResponsiveContainer route="createRecipe" gutter={false} fill>
          <PromptPhase
            insets={vm.insets}
            prompt={vm.prompt}
            generateError={vm.generateError}
            onChangePrompt={vm.onChangePrompt}
            onAppendChip={vm.onAppendChip}
            onGenerate={vm.onGenerate}
            onStartBlank={vm.onStartBlank}
            onImportFromInstagram={vm.onImportFromInstagram}
            onImportFromFile={vm.onImportFromFile}
            onClose={vm.onClose}
            latestDraft={vm.latestDraft}
            onResumeDraft={vm.onResumeDraft}
          />
        </ResponsiveContainer>
      </KeyboardAvoider>
    );
  }

  if (vm.phase === PhaseType.Resuming) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ResponsiveContainer route="createRecipe" gutter={false} fill>
          <ResumingView isWebShell={vm.isWebShell} topInset={vm.insets.top} onClose={vm.onClose} />
        </ResponsiveContainer>
      </View>
    );
  }

  if (vm.phase === PhaseType.Generating) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ResponsiveContainer route="createRecipe" gutter={false} fill>
          <GeneratingView activeStep={vm.genStep} onCancel={vm.onCancelGenerate} topInset={vm.isWebShell ? ValueConstants.zero : vm.insets.top} />
        </ResponsiveContainer>
      </View>
    );
  }

  return (
    <KeyboardAvoider style={[styles.root, { backgroundColor: colors.background }]}>
      <ResponsiveContainer route="createRecipe" gutter={false} fill>
        <CreateRecipePreview vm={vm} />
      </ResponsiveContainer>

      <PhotosSheet
        visible={vm.photosOpen}
        media={vm.recipe.media}
        onAdd={vm.onAddMedia}
        onRemove={vm.onRemoveMedia}
        onSetCover={vm.onSetCover}
        onClose={vm.onClosePhotos}
      />
      <ExitSheet
        visible={vm.exitOpen}
        editing={vm.isEditingSaved}
        onSaveDraft={vm.onSaveDraftAndExit}
        onDiscard={vm.onDiscardAndExit}
        onKeepEditing={vm.onKeepEditing}
      />
      <ConfirmSheet
        visible={assistantPublishOpen}
        title={t().assistant.publishTitle}
        message={t().assistant.publishMessage}
        confirmLabel={t().assistant.publishConfirm}
        onConfirm={() => {
          setAssistantPublishOpen(false);
          vm.onSaveAndPublish();
        }}
        onClose={() => setAssistantPublishOpen(false)}
      />

      <ConfirmSheet
        visible={vm.saveError !== null}
        title={t().createRecipe.saveErrorTitle}
        message={vm.saveError ?? CharConstants.empty}
        confirmLabel={t().common.retry}
        onConfirm={vm.onConfirmSaveError}
        onClose={vm.onCloseSaveError}
      />
      <FeedbackDialog
        severity={SeverityType.Danger}
        visible={vm.saveIssue !== null}
        title={t().createRecipe.saveErrorTitle}
        message={vm.saveIssue ?? CharConstants.empty}
        primaryLabel={t().common.ok}
        onPrimary={vm.onCloseSaveIssue}
        onClose={vm.onCloseSaveIssue}
      />
    </KeyboardAvoider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
  },
});

export default CreateRecipeScreen;
