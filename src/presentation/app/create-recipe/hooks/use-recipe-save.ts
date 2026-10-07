import { useCallback, useState } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { type Href, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { getLocale, t } from '@presentation/i18n';
import { failureKeyMessage, failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { FailureReporter } from '@presentation/base/errors/failure-reporter';
import { ValidationFailure, type Failure } from '@core/failure';
import { IngredientList } from '@domain/recipes/ingredients/ingredient-list';
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
  /** Writes a pending draft autosave now, so `fromDraftId` names a draft that exists. */
  flushDraft: () => Promise<void>;
  /** Stops autosaving for good; called before the saved draft is retired. */
  stopAutosave: () => void;
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
  flushDraft,
  stopAutosave,
}: UseRecipeSaveArgs) => {
  const router = useRouter();
  const { createdRecipesStore, draftsStore, recipePublishingStore } = useStores();
  const createState = createdRecipesStore((s) => s.createState);
  const isEditing = recipePublishingStore((s) => s.isBusy);
  const { publish } = usePublishRecipe();

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveIssue, setSaveIssue] = useState<string | null>(null);

  // Every rejected save is a dialog (a toast can sit off-screen); validation also marks the fields.
  const surfaceSaveFailure = useCallback(
    (failure: Failure): void => {
      // Reported as well as shown.
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

  const clearSaveFeedback = (): void => {
    setSaveIssue(null);
    setFieldErrors(NO_CREATE_RECIPE_FIELD_ERRORS);
  };

  const hasRequiredText = (): boolean => {
    const nameEmpty = recipe.name.trim().length === ValueConstants.zero;
    // A recipe of group headings only has no ingredients.
    const ingredientsEmpty = IngredientList.of(recipe.ingredients).filledCount === ValueConstants.zero;
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
    // The server reads the draft behind `fromDraftId` for provenance; it has to exist first.
    await flushDraft();
    // A photo is not required: a recipe written out in full saves without one.
    await createdRecipesStore
      .getState()
      .createRecipe(buildCreateInput(recipe, getLocale(), activeDraftId));
    const state = createdRecipesStore.getState().createState;
    if (state.status === StoreStatus.Success) {
      const newRecipeId = state.recipe.id;
      stopAutosave();
      createdRecipesStore.getState().resetCreateState();
      createdRecipesStore.getState().clearAiDraft();
      // Fallback for an older backend; the server retires the draft itself (fromDraftId).
      await draftsStore.getState().deleteDraft(activeDraftId);
      return newRecipeId;
    }
    if (state.status === StoreStatus.Error) {
      surfaceSaveFailure(state.failure);
      createdRecipesStore.getState().resetCreateState();
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe, createdRecipesStore, draftsStore, recipePublishingStore, activeDraftId, editRecipeId, surfaceSaveFailure, flushDraft, stopAutosave]);

  const openSaved = useCallback(
    (recipeId: string): void => {
      // Opened from the recipe page: go back rather than stack a copy.
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
