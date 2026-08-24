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
import { PromptPhase } from '@presentation/app/create-recipe/body/prompt-phase';
import { GeneratingView } from '@presentation/app/create-recipe/body/generating-view';
import { ResumingView } from '@presentation/app/create-recipe/body/resuming-view';
import { CreateRecipePreview } from '@presentation/app/create-recipe/body/create-recipe-preview';
import { PhotosSheet } from '@presentation/app/create-recipe/sheets/photos-sheet';
import { ExitSheet } from '@presentation/app/create-recipe/sheets/exit-sheet';
import { ConfirmSheet } from '@presentation/base/widgets/sheets/confirm-sheet';
import { FeedbackDialog } from '@presentation/base/widgets/dialogs/feedback-dialog';
import { CharConstants, ValueConstants } from '@core/constants';

export const CreateRecipeScreen = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const vm = useCreateRecipe();
  // Only the assistant's publish goes through here. A tap on Save is the user
  // already looking at the button they pressed; a spoken "yayınla" is a word
  // that may have been misheard, and publishing is not undoable.
  const [assistantPublishOpen, setAssistantPublishOpen] = useState(false);
  // Every sheet below lives in the preview phase; the prompt, resuming and
  // generating phases return early and render none of them. A confirmation
  // registered outside that phase was invisible and still accepted a spoken
  // "yes" — the user agreeing to nothing they could see.
  const isPreview = vm.phase === PhaseType.Preview;
  // At most ONE of these is live at a time, and the order is the drawing
  // order: a modal covers the inline dock, and the exit and save-error sheets
  // cover everything. Two live would let a "yes" read against the sheet on
  // screen answer the one behind it.
  // `photosOpen` belongs here too: `attachPhoto` can raise the picker over a
  // pending publish confirm, and a spoken "yes" would then publish while the
  // user is looking at their photo library.
  const exitOrErrorOpen =
    vm.exitOpen || vm.saveError !== null || vm.saveIssue !== null || vm.photosOpen;
  // The exit sheet is a question with three answers and it was the only sheet
  // here the assistant could not answer: "çık" reached the global handler,
  // which pops the route and leaves the autosaved draft saved — the opposite
  // of what the user had just said out loud.
  const isExitPending =
    vm.exitOpen && vm.saveError === null && vm.saveIssue === null && !vm.photosOpen;

  // Registered here rather than deeper down because the assistant's actions
  // belong to the SCREEN: they are available exactly while a draft is open,
  // and answer `unavailable_here` everywhere else.
  useAssistantExitActions({
    isExitPending,
    onClose: vm.onClose,
    onSaveDraftAndExit: vm.onSaveDraftAndExit,
    onDiscardAndExit: vm.onDiscardAndExit,
  });
  useAssistantDraftActions({
    // Only while the editor is on screen. In the prompt phase there is nothing
    // to edit and no confirmation sheet — the same condition the two
    // confirmations below already carry.
    isDraftVisible: isPreview,
    // The prompt phase offers exactly one draft to continue, and "taslağıma
    // devam et" is a thing people say to a screen that shows the card.
    isPromptVisible: vm.phase === PhaseType.Prompt,
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
  // Each sheet that stops the assistant also takes a spoken answer, or the
  // hands-free flow ends at the gate meant to protect it.
  useAssistantConfirmation(
    isPreview && assistantPublishOpen && !exitOrErrorOpen,
    () => {
      setAssistantPublishOpen(false);
      vm.onSave();
    },
    () => setAssistantPublishOpen(false),
  );
  // Exactly one confirmation is pending at a time. The publish sheet is a
  // modal drawn over everything, so while it is up the spoken "yes" belongs to
  // it — offering both would let a user reading the publish sheet accept the
  // refine proposal behind it instead, and be told the publish succeeded.
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
          <GeneratingView activeStep={vm.genStep} />
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
          vm.onSave();
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
        severity="danger"
        visible={vm.saveIssue !== null}
        title={t().createRecipe.saveErrorTitle}
        message={vm.saveIssue ?? CharConstants.empty}
        primaryLabel={t().common.ok}
        onPrimary={vm.onCloseSaveIssue}
        onClose={vm.onCloseSaveIssue}
      />
      <FeedbackDialog
        visible={vm.saveSuccess !== null}
        title={t().createRecipe.successTitle}
        message={t().createRecipe.successPublished}
        primaryLabel={t().createRecipe.viewRecipe}
        onPrimary={vm.onSuccessPrimary}
        onClose={vm.onCloseSuccess}
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
