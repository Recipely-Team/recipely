import { useCallback, useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { getLocale, t } from '@presentation/i18n';
import { failureKeyMessage, failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { ValidationFailure, type Failure } from '@core/failure';
import { buildCreateInput, buildUpdateInput } from '@presentation/app/create-recipe/model/saving/build-recipe-input';
import { mapFieldErrorsToInputs, NO_CREATE_RECIPE_FIELD_ERRORS } from '@presentation/app/create-recipe/model/validation/map-field-errors-to-inputs';
import type { CreateRecipeFieldErrors } from '@presentation/app/create-recipe/model/validation/create-recipe-field-errors';
import type { UseRecipeSaveArgs } from '@presentation/app/create-recipe/model/saving/use-recipe-save-args';
import { ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Handles publishing a new recipe or updating an existing one, including the
 * required-field guards, the per-field validation binding, and the blocking
 * retry dialog for non-validation failures.
 */
export const useRecipeSave = ({
  recipe,
  recipeId,
  isEditMode,
  activeDraftId,
  setFieldErrors,
}: UseRecipeSaveArgs) => {
  const router = useRouter();
  const { createdRecipesStore, draftsStore } = useStores();
  const createState = createdRecipesStore((s) => s.createState);
  const updateState = createdRecipesStore((s) => s.updateState);

  const [saveError, setSaveError] = useState<{ message: string; mode: 'publish' | 'update' } | null>(null);
  const [saveIssue, setSaveIssue] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<
    { mode: 'publish'; recipeId: string } | { mode: 'update' } | null
  >(null);

  // WHY: every rejected save surfaces as a dialog — a positional banner/toast can
  // sit off-screen on a long scrolling editor, and a dialog cannot be missed. A
  // `ValidationFailure` additionally binds its per-field breakdown to inputs
  // (red border + inline message). The dialog copy comes from the localized
  // key/code tiers, NEVER from the backend's raw `message` (which may be
  // unlocalised English). Non-validation failures get the retry dialog instead.
  const surfaceSaveFailure = useCallback(
    (failure: Failure, mode: 'publish' | 'update'): void => {
      if (!(failure instanceof ValidationFailure)) {
        setFieldErrors(NO_CREATE_RECIPE_FIELD_ERRORS);
        setSaveError({ message: failureToastMessage(failure), mode });
        return;
      }
      setFieldErrors(mapFieldErrorsToInputs(failure.fieldErrors));
      setSaveIssue(failureKeyMessage(failure) ?? failureToastMessage(failure));
    },
    [setFieldErrors],
  );

  // Clears the previous rejection dialog and every inline field error at the
  // start of a save attempt so it doesn't linger over a fresh submission.
  const clearSaveFeedback = (): void => {
    setSaveIssue(null);
    setFieldErrors(NO_CREATE_RECIPE_FIELD_ERRORS);
  };

  const hasRequiredText = (): boolean => {
    const nameEmpty = recipe.name.trim().length === ValueConstants.zero;
    const ingredientsEmpty = recipe.ingredients.every((s) => s.trim().length === ValueConstants.zero);
    if (nameEmpty || ingredientsEmpty) {
      const fields: CreateRecipeFieldErrors['fields'] = {};
      if (nameEmpty) fields.name = t().createRecipe.nameRequired;
      if (ingredientsEmpty) fields.ingredients = t().createRecipe.ingredientsRequired;
      setFieldErrors({ fields, unmatched: [] });
      setSaveIssue(t().createRecipe.missing);
      return false;
    }
    return true;
  };

  const handlePublish = useCallback(async (): Promise<void> => {
    clearSaveFeedback();
    if (!hasRequiredText()) return;
    // WHY: the backend create endpoint requires a cover image URL, so a recipe
    // cannot be published without at least one photo.
    if (recipe.media.filter((m) => m.type === 'image').length === ValueConstants.zero) {
      setSaveIssue(t().createRecipe.noImage);
      return;
    }
    await createdRecipesStore.getState().createRecipe(buildCreateInput(recipe, getLocale()));
    const state = createdRecipesStore.getState().createState;
    if (state.status === 'success') {
      // Capture the new recipe's id before the store state is reset so the
      // success dialog can deep-link straight to its detail page.
      const newRecipeId = state.recipe.id;
      createdRecipesStore.getState().resetCreateState();
      createdRecipesStore.getState().clearAiDraft();
      // Best-effort cleanup of the working draft now that it's published.
      await draftsStore.getState().deleteDraft(activeDraftId);
      setSaveSuccess({ mode: 'publish', recipeId: newRecipeId });
      return;
    }
    if (state.status === 'error') {
      surfaceSaveFailure(state.failure, 'publish');
      createdRecipesStore.getState().resetCreateState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe, createdRecipesStore, draftsStore, activeDraftId, surfaceSaveFailure]);

  const handleUpdate = useCallback(async (): Promise<void> => {
    if (recipeId === undefined) return;
    clearSaveFeedback();
    if (!hasRequiredText()) return;
    await createdRecipesStore.getState().updateRecipe(recipeId, buildUpdateInput(recipe, getLocale()));
    const state = createdRecipesStore.getState().updateState;
    if (state.status === 'success') {
      createdRecipesStore.getState().resetUpdateState();
      setSaveSuccess({ mode: 'update' });
      return;
    }
    if (state.status === 'error') {
      surfaceSaveFailure(state.failure, 'update');
      createdRecipesStore.getState().resetUpdateState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe, recipeId, createdRecipesStore, surfaceSaveFailure]);

  const onSave = useCallback((): void => {
    if (isEditMode) void handleUpdate();
    else void handlePublish();
  }, [isEditMode, handleUpdate, handlePublish]);

  // Primary action: publish → open the new recipe; update → return to the editor's caller.
  const onSuccessPrimary = useCallback((): void => {
    const success = saveSuccess;
    setSaveSuccess(null);
    if (success?.mode === 'publish') {
      router.replace(RoutePaths.recipeDetail(success.recipeId) as Href);
    } else {
      router.back();
    }
  }, [saveSuccess, router]);

  // Dismiss / secondary "Done": publish → My Recipes; update → back. Also the backdrop close.
  const onCloseSuccess = useCallback((): void => {
    const mode = saveSuccess?.mode;
    setSaveSuccess(null);
    if (mode === 'publish') router.replace(RoutePaths.myRecipes);
    else router.back();
  }, [saveSuccess, router]);

  const headerTitle = useMemo(
    () => (isEditMode ? t().createRecipe.editorTitle : t().createRecipe.previewTitle),
    [isEditMode],
  );

  const isSaving = isEditMode ? updateState.status === 'updating' : createState.status === 'creating';
  const saveLabel = isEditMode
    ? updateState.status === 'updating'
      ? t().createRecipe.updating
      : t().createRecipe.updateSave
    : createState.status === 'creating'
      ? t().createRecipe.publishing
      : t().createRecipe.save;

  return {
    onSave,
    isSaving,
    saveLabel,
    headerTitle,
    saveError,
    onConfirmSaveError: () => {
      const mode = saveError?.mode;
      setSaveError(null);
      void (mode === 'update' ? handleUpdate() : handlePublish());
    },
    onCloseSaveError: () => setSaveError(null),
    saveIssue,
    onCloseSaveIssue: () => setSaveIssue(null),
    saveSuccess,
    onSuccessPrimary,
    onCloseSuccess,
  };
};
