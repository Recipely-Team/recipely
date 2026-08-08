import { StyleSheet, View } from 'react-native';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
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
        secondaryLabel={t().createRecipe.successDone}
        onSecondary={vm.onCloseSuccess}
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
