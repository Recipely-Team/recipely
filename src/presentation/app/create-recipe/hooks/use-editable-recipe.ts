import { useCallback, useState } from 'react';
import type { MediaItem } from '@domain/recipes/media/media-item';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/empty-editable';
import { NO_CREATE_RECIPE_FIELD_ERRORS } from '@presentation/app/create-recipe/model/validation/map-field-errors-to-inputs';
import type { CreateRecipeFieldErrors } from '@presentation/app/create-recipe/model/validation/create-recipe-field-errors';
import type { CreateRecipeFieldKey } from '@presentation/app/create-recipe/model/validation/create-recipe-field-key';
import { INGREDIENT_GROUP_PREFIX } from '@domain/recipes/ingredients/ingredient-group-prefix';
import { CharConstants, ValueConstants } from '@core/constants';

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
  /** Appends a blank ingredient row — what a person tapping "+" wants. */
  const onAddIngredient = useCallback((): void => {
    setRecipe((r) => ({ ...r, ingredients: [...r.ingredients, CharConstants.empty] }));
    clearFieldError('ingredients');
  }, [clearFieldError]);

  /**
   * Appends an ingredient row that already has its text.
   *
   * Separate from {@link onAddIngredient} rather than an optional parameter on
   * it. The blank version is wired straight to a Pressable's `onPress`, which
   * calls it WITH the gesture event — an optional first parameter therefore
   * pushed a `GestureResponderEvent` into a `string[]` on an ordinary tap, and
   * neither the type (three levels of `() => void` props) nor any test saw it.
   *
   * It exists at all because the assistant adds two things in one breath: two
   * tool calls in one model turn run as microtasks, before React re-renders,
   * so appending and then writing had both calls land on the same index.
   */
  const onAppendIngredient = useCallback((value: string): void => {
    setRecipe((r) => ({ ...r, ingredients: [...r.ingredients, value] }));
    clearFieldError('ingredients');
  }, [clearFieldError]);
  /**
   * Inserts a blank ingredient INSIDE a group rather than at the end of the
   * recipe — appending would have dropped it into whichever group happens to be
   * last, which is what made adding to the right one a chore.
   */
  const onAddIngredientAt = useCallback(
    (index: number): void => {
      setRecipe((r) => {
        const next = [...r.ingredients];
        next.splice(index, ValueConstants.zero, CharConstants.empty);
        return { ...r, ingredients: next };
      });
      clearFieldError('ingredients');
    },
    [clearFieldError],
  );
  const onMoveIngredient = useCallback((from: number, to: number): void => {
    setRecipe((r) => {
      if (to < ValueConstants.zero || to >= r.ingredients.length) return r;
      const next = [...r.ingredients];
      const [moved] = next.splice(from, ValueConstants.one);
      if (moved === undefined) return r;
      next.splice(to, ValueConstants.zero, moved);
      return { ...r, ingredients: next };
    });
  }, []);
  /**
   * Drops a group heading, and — unless the ingredients are being kept — the
   * ingredients under it. `keepItems` is the difference between "I grouped
   * these wrongly" and "these are not in the recipe", which one button could
   * not have said.
   */
  const onRemoveIngredientGroup = useCallback(
    (headerIndex: number, itemIndices: readonly number[], keepItems: boolean): void => {
      setRecipe((r) => {
        const doomed = new Set<number>(keepItems ? [headerIndex] : [headerIndex, ...itemIndices]);
        const kept = r.ingredients.filter((_, idx) => !doomed.has(idx));
        return { ...r, ingredients: kept.length === ValueConstants.zero ? [CharConstants.empty] : kept };
      });
      clearFieldError('ingredients');
    },
    [clearFieldError],
  );
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
  /** Appends a blank instruction row — what a person tapping "+" wants. */
  const onAddStep = useCallback((): void => {
    setRecipe((r) => ({ ...r, instructions: [...r.instructions, CharConstants.empty] }));
    clearFieldError('instructions');
  }, [clearFieldError]);

  /** Appends an instruction that already has its text — see {@link onAppendIngredient}. */
  const onAppendStep = useCallback((value: string): void => {
    setRecipe((r) => ({ ...r, instructions: [...r.instructions, value] }));
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
    onAppendIngredient,
    onAddIngredientAt,
    onMoveIngredient,
    onAddIngredientGroup,
    onRemoveIngredientGroup,
    onChangeStep,
    onRemoveStep,
    onAddStep,
    onAppendStep,
    onAddMedia,
    onRemoveMedia,
    onSetCover,
    photosOpen,
    onOpenPhotos: () => setPhotosOpen(true),
    onClosePhotos: () => setPhotosOpen(false),
  };
};
