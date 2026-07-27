import { useCallback, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { getLocale, t } from '@presentation/i18n';
import { failureKeyMessage, failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { ValidationFailure, type Failure } from '@core/failure';
import { buildCreateInput } from '@presentation/app/create-recipe/model/saving/build-recipe-input';
import { mapFieldErrorsToInputs, NO_CREATE_RECIPE_FIELD_ERRORS } from '@presentation/app/create-recipe/model/validation/map-field-errors-to-inputs';
import type { CreateRecipeFieldErrors } from '@presentation/app/create-recipe/model/validation/create-recipe-field-errors';
import type { UseRecipeSaveArgs } from '@presentation/app/create-recipe/model/saving/use-recipe-save-args';
import { ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Handles publishing a recipe: the required-field guards, the per-field
 * validation binding, and the blocking retry dialog for non-validation
 * failures.
 */
export const useRecipeSave = ({
  recipe,
  activeDraftId,
  setFieldErrors,
}: UseRecipeSaveArgs) => {
  const router = useRouter();
  const { createdRecipesStore, draftsStore } = useStores();
  const createState = createdRecipesStore((s) => s.createState);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveIssue, setSaveIssue] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<{ recipeId: string } | null>(null);

  // WHY: every rejected save surfaces as a dialog — a positional banner/toast can
  // sit off-screen on a long scrolling editor, and a dialog cannot be missed. A
  // `ValidationFailure` additionally binds its per-field breakdown to inputs
  // (red border + inline message). The dialog copy comes from the localized
  // key/code tiers, NEVER from the backend's raw `message` (which may be
  // unlocalised English). Non-validation failures get the retry dialog instead.
  const surfaceSaveFailure = useCallback(
    (failure: Failure): void => {
      if (!(failure instanceof ValidationFailure)) {
        setFieldErrors(NO_CREATE_RECIPE_FIELD_ERRORS);
        setSaveError(failureToastMessage(failure));
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
      setSaveSuccess({ recipeId: newRecipeId });
      return;
    }
    if (state.status === 'error') {
      surfaceSaveFailure(state.failure);
      createdRecipesStore.getState().resetCreateState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe, createdRecipesStore, draftsStore, activeDraftId, surfaceSaveFailure]);

  const onSave = useCallback((): void => {
    void handlePublish();
  }, [handlePublish]);

  // Primary action: open the recipe that was just published.
  const onSuccessPrimary = useCallback((): void => {
    const success = saveSuccess;
    setSaveSuccess(null);
    if (success !== null) router.replace(RoutePaths.recipeDetail(success.recipeId) as Href);
  }, [saveSuccess, router]);

  // Dismiss / secondary "Done", and the backdrop close: go to My Recipes — on
  // the "created" tab, which is where the recipe that was just published is.
  const onCloseSuccess = useCallback((): void => {
    setSaveSuccess(null);
    router.replace(RoutePaths.myRecipesCreated as Href);
  }, [router]);

  const headerTitle = t().createRecipe.previewTitle;
  const isSaving = createState.status === 'creating';
  const saveLabel =
    createState.status === 'creating' ? t().createRecipe.publishing : t().createRecipe.save;

  return {
    onSave,
    isSaving,
    saveLabel,
    headerTitle,
    saveError,
    onConfirmSaveError: () => {
      setSaveError(null);
      void handlePublish();
    },
    onCloseSaveError: () => setSaveError(null),
    saveIssue,
    onCloseSaveIssue: () => setSaveIssue(null),
    saveSuccess,
    onSuccessPrimary,
    onCloseSuccess,
  };
};
