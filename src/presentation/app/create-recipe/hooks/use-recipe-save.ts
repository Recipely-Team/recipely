import { useCallback, useState } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { type Href, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { getLocale, t } from '@presentation/i18n';
import { failureKeyMessage, failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { FailureReporter } from '@presentation/base/errors/failure-reporter';
import { ValidationFailure, type Failure } from '@core/failure';
import { isIngredientGroup } from '@domain/recipes/ingredients/is-ingredient-group';
import { buildCreateInput } from '@presentation/app/create-recipe/model/saving/build-recipe-input';
import { buildEditInput } from '@presentation/app/create-recipe/model/saving/build-edit-input';
import { showSuccessToast } from '@presentation/base/feedback/show-toast';
import { usePublishRecipe } from '@presentation/base/hooks/recipes/use-publish-recipe';
import { mapFieldErrorsToInputs, NO_CREATE_RECIPE_FIELD_ERRORS } from '@presentation/app/create-recipe/model/validation/map-field-errors-to-inputs';
import type { CreateRecipeFieldErrors } from '@presentation/app/create-recipe/model/validation/create-recipe-field-errors';
import { ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';

/** Where a refused publish is filed, on the crash list and in analytics. */
const PUBLISH_CONTEXT = 'CreateRecipe.publish';

interface UseRecipeSaveArgs {
  recipe: EditableRecipe;
  activeDraftId: string;
  setFieldErrors: (errors: CreateRecipeFieldErrors) => void;
  /** Set when the editor was opened on a private recipe: saving goes through PATCH. */
  editRecipeId: string | undefined;
}

/**
 * Saves the recipe in the editor — always privately.
 *
 * @remarks
 * - **Save first, publish later.** The button is a lock and "Save"; there is no
 *   save-and-publish shortcut for a tap. A new recipe is created private, an
 *   opened private recipe is saved through PATCH, and either way the user lands
 *   on its page with a toast saying only they can see it. Publishing happens
 *   there, from the owner's status panel.
 * - **The assistant's publish is save, then publish** — a spoken "yayınla" asks
 *   for both, and the publish toast says where the recipe landed.
 * - **Every rejected save is a dialog**, never a toast: a positional message can
 *   sit off-screen on a long editor. Validation failures also bind their field
 *   errors to the inputs; copy always comes from the localized key/code tiers.
 */
export const useRecipeSave = ({
  recipe,
  activeDraftId,
  setFieldErrors,
  editRecipeId,
}: UseRecipeSaveArgs) => {
  const router = useRouter();
  const { createdRecipesStore, draftsStore, recipePublishingStore } = useStores();
  const createState = createdRecipesStore((s) => s.createState);
  const isEditing = recipePublishingStore((s) => s.isBusy);
  const { publish } = usePublishRecipe();

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveIssue, setSaveIssue] = useState<string | null>(null);

  // WHY: every rejected save surfaces as a dialog — a positional banner/toast can
  // sit off-screen on a long scrolling editor, and a dialog cannot be missed. A
  // `ValidationFailure` additionally binds its per-field breakdown to inputs
  // (red border + inline message). The dialog copy comes from the localized
  // key/code tiers, NEVER from the backend's raw `message` (which may be
  // unlocalised English). Non-validation failures get the retry dialog instead.
  const surfaceSaveFailure = useCallback(
    (failure: Failure): void => {
      // Reported as well as shown. A refused publish was the one user-visible
      // failure in the app that reached neither analytics nor the crash list,
      // so "kaydedemedim" was all anyone — the user, the assistant asked to
      // report it, or us — ever had to go on.
      FailureReporter.report(failure, PUBLISH_CONTEXT);
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
    // A recipe of nothing but group headings has no ingredients: "# Şerbet"
    // names a part, it does not put anything in it.
    const ingredientsEmpty = recipe.ingredients.every(
      (s) => s.trim().length === ValueConstants.zero || isIngredientGroup(s),
    );
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

  /** Saves privately — create, or PATCH when editing — and answers with the recipe id. */
  const persist = useCallback(async (): Promise<string | null> => {
    clearSaveFeedback();
    if (!hasRequiredText()) return null;
    if (editRecipeId !== undefined) {
      const failure = await recipePublishingStore
        .getState()
        .edit(editRecipeId, buildEditInput(recipe, getLocale()));
      if (failure !== null) {
        surfaceSaveFailure(failure);
        return null;
      }
      return editRecipeId;
    }
    // A photo is not required: a recipe written out in full saves without one.
    await createdRecipesStore
      .getState()
      .createRecipe(buildCreateInput(recipe, getLocale(), activeDraftId));
    const state = createdRecipesStore.getState().createState;
    if (state.status === StoreStatus.Success) {
      const newRecipeId = state.recipe.id;
      createdRecipesStore.getState().resetCreateState();
      createdRecipesStore.getState().clearAiDraft();
      // The server retires the draft itself (`fromDraftId`); this delete is the
      // fallback for an older backend, and a 404 from a current one is fine.
      await draftsStore.getState().deleteDraft(activeDraftId);
      return newRecipeId;
    }
    if (state.status === StoreStatus.Error) {
      surfaceSaveFailure(state.failure);
      createdRecipesStore.getState().resetCreateState();
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe, createdRecipesStore, draftsStore, recipePublishingStore, activeDraftId, editRecipeId, surfaceSaveFailure]);

  const openSaved = useCallback(
    (recipeId: string): void => {
      // An edit was opened from the recipe's own page, which is still below
      // the editor: go back to it rather than stacking a second copy.
      if (editRecipeId !== undefined && router.canGoBack()) {
        router.back();
        return;
      }
      router.replace(RoutePaths.recipeDetail(recipeId) as Href);
    },
    [router, editRecipeId],
  );

  const onSave = useCallback((): void => {
    void (async () => {
      const recipeId = await persist();
      if (recipeId === null) return;
      openSaved(recipeId);
      showSuccessToast(t().createRecipe.savedPrivately);
    })();
  }, [persist, openSaved]);

  // The assistant's "publish": the same private save, then the publish request,
  // whose toast says where the recipe landed.
  const onSaveAndPublish = useCallback((): void => {
    void (async () => {
      const recipeId = await persist();
      if (recipeId === null) return;
      openSaved(recipeId);
      await publish(recipeId);
    })();
  }, [persist, openSaved, publish]);

  const isSaving = createState.status === StoreStatus.Creating || isEditing;
  const headerTitle =
    editRecipeId === undefined ? t().createRecipe.previewTitle : t().createRecipe.editTitle;
  const saveLabel = isSaving ? t().createRecipe.saving : t().createRecipe.save;

  return {
    onSave,
    onSaveAndPublish,
    isSaving,
    saveLabel,
    headerTitle,
    saveError,
    onConfirmSaveError: () => {
      setSaveError(null);
      onSave();
    },
    onCloseSaveError: () => setSaveError(null),
    saveIssue,
    onCloseSaveIssue: () => setSaveIssue(null),
  };
};
