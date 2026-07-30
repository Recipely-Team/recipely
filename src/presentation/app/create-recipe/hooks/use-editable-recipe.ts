import { useCallback, useState } from 'react';
import type { MediaItem } from '@domain/recipes/media/media-item';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/recipe-mapping';
import { NO_CREATE_RECIPE_FIELD_ERRORS } from '@presentation/app/create-recipe/model/validation/map-field-errors-to-inputs';
import type { CreateRecipeFieldErrors } from '@presentation/app/create-recipe/model/validation/create-recipe-field-errors';
import type { CreateRecipeFieldKey } from '@presentation/app/create-recipe/model/validation/create-recipe-field-key';
import { INGREDIENT_GROUP_PREFIX } from '@domain/recipes/ingredients/ingredient-group-prefix';
import { CharConstants } from '@core/constants';

/**
 * Owns the editable recipe form state (fields, ingredients, steps, media) plus
 * the per-field validation errors and the "missing required fields" banner, and
 * exposes intent-revealing edit handlers that clear a field's error on change.
 */
export const useEditableRecipe = () => {
  const [recipe, setRecipe] = useState<EditableRecipe>(emptyEditable);
  const [fieldErrors, setFieldErrors] = useState<CreateRecipeFieldErrors>(NO_CREATE_RECIPE_FIELD_ERRORS);
  const [photosOpen, setPhotosOpen] = useState(false);

  // Clears a single field's inline validation error once the user edits it.
  const clearFieldError = useCallback((key: CreateRecipeFieldKey): void => {
    setFieldErrors((prev) => {
      if (prev.fields[key] === undefined) return prev;
      const nextFields: CreateRecipeFieldErrors['fields'] = { ...prev.fields };
      delete nextFields[key];
      return { ...prev, fields: nextFields };
    });
  }, []);

  const onUpdateField = useCallback(
    <K extends keyof EditableRecipe>(key: K, value: EditableRecipe[K]): void => {
      setRecipe((r) => ({ ...r, [key]: value }));
      if (key !== 'media') clearFieldError(key as CreateRecipeFieldKey);
    },
    [clearFieldError],
  );

  const onChangeIngredient = useCallback(
    (i: number, value: string): void => {
      setRecipe((r) => ({ ...r, ingredients: r.ingredients.map((x, idx) => (idx === i ? value : x)) }));
      clearFieldError('ingredients');
    },
    [clearFieldError],
  );
  const onRemoveIngredient = useCallback(
    (i: number): void => {
      setRecipe((r) => ({
        ...r,
        ingredients: r.ingredients.length <= 1 ? [CharConstants.empty] : r.ingredients.filter((_, idx) => idx !== i),
      }));
      clearFieldError('ingredients');
    },
    [clearFieldError],
  );
  const onAddIngredient = useCallback((): void => {
    setRecipe((r) => ({ ...r, ingredients: [...r.ingredients, CharConstants.empty] }));
    clearFieldError('ingredients');
  }, [clearFieldError]);
  // Appends the bare marker; the row it renders as edits the label. An unnamed
  // group is dropped on save rather than published as a blank heading.
  const onAddIngredientGroup = useCallback((): void => {
    setRecipe((r) => ({ ...r, ingredients: [...r.ingredients, INGREDIENT_GROUP_PREFIX] }));
  }, []);
  const onChangeStep = useCallback(
    (i: number, value: string): void => {
      setRecipe((r) => ({ ...r, instructions: r.instructions.map((x, idx) => (idx === i ? value : x)) }));
      clearFieldError('instructions');
    },
    [clearFieldError],
  );
  const onRemoveStep = useCallback(
    (i: number): void => {
      setRecipe((r) => ({
        ...r,
        instructions: r.instructions.length <= 1 ? [CharConstants.empty] : r.instructions.filter((_, idx) => idx !== i),
      }));
      clearFieldError('instructions');
    },
    [clearFieldError],
  );
  const onAddStep = useCallback((): void => {
    setRecipe((r) => ({ ...r, instructions: [...r.instructions, CharConstants.empty] }));
    clearFieldError('instructions');
  }, [clearFieldError]);

  const onAddMedia = useCallback(
    (items: MediaItem[]): void => setRecipe((r) => ({ ...r, media: [...r.media, ...items] })),
    [],
  );
  const onRemoveMedia = useCallback(
    (i: number): void => setRecipe((r) => ({ ...r, media: r.media.filter((_, idx) => idx !== i) })),
    [],
  );
  const onSetCover = useCallback((i: number): void => {
    setRecipe((r) => {
      const arr = [...r.media];
      const [picked] = arr.splice(i, 1);
      if (picked === undefined) return r;
      return { ...r, media: [picked, ...arr] };
    });
  }, []);

  return {
    recipe,
    setRecipe,
    fieldErrors,
    setFieldErrors,
    onUpdateField,
    onChangeIngredient,
    onRemoveIngredient,
    onAddIngredient,
    onAddIngredientGroup,
    onChangeStep,
    onRemoveStep,
    onAddStep,
    onAddMedia,
    onRemoveMedia,
    onSetCover,
    photosOpen,
    onOpenPhotos: () => setPhotosOpen(true),
    onClosePhotos: () => setPhotosOpen(false),
  };
};
