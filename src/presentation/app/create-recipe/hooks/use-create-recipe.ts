import { useRef } from 'react';
import { isString } from '@core/guards/type-guards';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useEditableRecipe } from '@presentation/app/create-recipe/hooks/use-editable-recipe';
import { useRecipeGeneration } from '@presentation/app/create-recipe/hooks/use-recipe-generation';
import { useRecipeSave } from '@presentation/app/create-recipe/hooks/use-recipe-save';
import type { UseCreateRecipeResult } from '@presentation/app/create-recipe/model/use-create-recipe-result';

/**
 * Assembles the create-recipe view model from the focused sub-hooks:
 * {@link useEditableRecipe} (form state), {@link useRecipeGeneration} (AI phase
 * flow + drafts), and {@link useRecipeSave} (publish). The screen renders the
 * returned state and dispatches its handlers.
 */
export const useCreateRecipe = (): UseCreateRecipeResult => {
  const insets = useSafeAreaInsets();
  const { isWebShell } = useLayout();

  const params = useLocalSearchParams<{ draftId?: string }>();
  const draftId = isString(params.draftId) ? params.draftId : undefined;

  // A stable draft id for the lifetime of a NEW draft. A real UUID is required
  // by the backend; resumed drafts reuse their own id.
  const newDraftId = useRef(Crypto.randomUUID()).current;
  const activeDraftId = draftId ?? newDraftId;

  const editable = useEditableRecipe();
  const generation = useRecipeGeneration({
    recipe: editable.recipe,
    setRecipe: editable.setRecipe,
    activeDraftId,
    draftId,
  });
  const save = useRecipeSave({
    recipe: editable.recipe,
    activeDraftId,
    setFieldErrors: editable.setFieldErrors,
  });

  return {
    phase: generation.phase,
    isWebShell,
    insets,
    prompt: generation.prompt,
    generateError: generation.generateError,
    onChangePrompt: generation.onChangePrompt,
    onAppendChip: generation.onAppendChip,
    onGenerate: generation.onGenerate,
    onStartBlank: generation.onStartBlank,
    onImportFromInstagram: generation.onImportFromInstagram,
    onClose: generation.onClose,
    latestDraft: generation.latestDraft,
    onResumeDraft: generation.onResumeDraft,
    genStep: generation.genStep,
    headerTitle: save.headerTitle,
    saveLabel: save.saveLabel,
    isSaving: save.isSaving,
    onSave: save.onSave,
    refining: generation.refining,
    recipe: editable.recipe,
    fieldErrors: editable.fieldErrors.fields,
    onUpdateField: editable.onUpdateField,
    onChangeIngredient: editable.onChangeIngredient,
    onRemoveIngredient: editable.onRemoveIngredient,
    onAddIngredient: editable.onAddIngredient,
    onAddIngredientAt: editable.onAddIngredientAt,
    onMoveIngredient: editable.onMoveIngredient,
    onRemoveIngredientGroup: editable.onRemoveIngredientGroup,
    onAddIngredientGroup: editable.onAddIngredientGroup,
    onChangeStep: editable.onChangeStep,
    onRemoveStep: editable.onRemoveStep,
    onAddStep: editable.onAddStep,
    onOpenPhotos: editable.onOpenPhotos,
    chatHistory: generation.chatHistory,
    chatInput: generation.chatInput,
    onChangeChatInput: generation.onChangeChatInput,
    chatExpanded: generation.chatExpanded,
    onExpandChat: generation.onExpandChat,
    onCollapseChat: generation.onCollapseChat,
    canRegenerate: generation.canRegenerate,
    onRegenerate: generation.onRegenerate,
    onSubmitRefine: generation.onSubmitRefine,
    proposal: generation.proposal,
    onAcceptProposal: generation.onAcceptProposal,
    onRejectProposal: generation.onRejectProposal,
    photosOpen: editable.photosOpen,
    onClosePhotos: editable.onClosePhotos,
    onAddMedia: editable.onAddMedia,
    onRemoveMedia: editable.onRemoveMedia,
    onSetCover: editable.onSetCover,
    exitOpen: generation.exitOpen,
    onSaveDraftAndExit: generation.onSaveDraftAndExit,
    onDiscardAndExit: generation.onDiscardAndExit,
    onKeepEditing: generation.onKeepEditing,
    saveError: save.saveError,
    onConfirmSaveError: save.onConfirmSaveError,
    onCloseSaveError: save.onCloseSaveError,
    saveIssue: save.saveIssue,
    onCloseSaveIssue: save.onCloseSaveIssue,
    saveSuccess: save.saveSuccess,
    onSuccessPrimary: save.onSuccessPrimary,
    onCloseSuccess: save.onCloseSuccess,
  };
};
