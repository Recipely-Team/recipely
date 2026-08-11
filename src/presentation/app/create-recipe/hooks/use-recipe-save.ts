import { useCallback, useState } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { type Href, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { getLocale, t } from '@presentation/i18n';
import { failureKeyMessage, failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { ValidationFailure, type Failure } from '@core/failure';
import { isIngredientGroup } from '@domain/recipes/ingredients/is-ingredient-group';
import { buildCreateInput } from '@presentation/app/create-recipe/model/saving/build-recipe-input';
import { mapFieldErrorsToInputs, NO_CREATE_RECIPE_FIELD_ERRORS } from '@presentation/app/create-recipe/model/validation/map-field-errors-to-inputs';
import type { CreateRecipeFieldErrors } from '@presentation/app/create-recipe/model/validation/create-recipe-field-errors';
import { ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';

interface UseRecipeSaveArgs {
  recipe: EditableRecipe;
  activeDraftId: string;
  setFieldErrors: (errors: CreateRecipeFieldErrors) => void;
}

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

  const handlePublish = useCallback(async (): Promise<void> => {
    clearSaveFeedback();
    if (!hasRequiredText()) return;
    // A photo is no longer required. It was only ever a guard mirroring the
    // backend's own `image` requirement, and that requirement cost more than it
    // bought: a recipe someone had written out in full could not be published
    // because they had no photo to hand, and a resumed draft — whose cover was
    // a device URI that no longer resolved — hit it with no way to understand
    // why. Publishing without a cover is now allowed on both sides.
    await createdRecipesStore
      .getState()
      .createRecipe(buildCreateInput(recipe, getLocale(), activeDraftId));
    const state = createdRecipesStore.getState().createState;
    if (state.status === StoreStatus.Success) {
      // Capture the new recipe's id before the store state is reset so the
      // success dialog can deep-link straight to its detail page.
      const newRecipeId = state.recipe.id;
      createdRecipesStore.getState().resetCreateState();
      createdRecipesStore.getState().clearAiDraft();
      // The server retires the draft itself now — it is told which one by
      // `fromDraftId`, which is also how the import notification learns to open
      // the recipe instead of the draft it used to point at. This delete stays
      // as the fallback for a build running against a backend that predates
      // that: against a current one it simply 404s, which this call already
      // tolerates. Remove it once no shipped version can reach an older API.
      await draftsStore.getState().deleteDraft(activeDraftId);
      setSaveSuccess({ recipeId: newRecipeId });
      return;
    }
    if (state.status === StoreStatus.Error) {
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
    // `dismissTo`, not `replace`: My Recipes is already under the create screen,
    // and replacing would leave a second copy of it below this one — a back
    // press would then land on the saved tab and read as the recipe vanishing.
    router.dismissTo({
      pathname: RoutePaths.myRecipes,
      params: { tab: RoutePaths.myRecipesCreatedTab },
    });
  }, [router]);

  const headerTitle = t().createRecipe.previewTitle;
  const isSaving = createState.status === StoreStatus.Creating;
  // `publishShort`, not `save`: the button does not save anything private — it
  // puts the recipe out where other people can find it, and the in-flight label
  // has always said "Publishing…". Reading "Kaydet" and then "Yayınlanıyor…" on
  // the same press described two different actions, and the first one was the
  // wrong one.
  const saveLabel =
    createState.status === StoreStatus.Creating
      ? t().createRecipe.publishing
      : t().createRecipe.publishShort;

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
