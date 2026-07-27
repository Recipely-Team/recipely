import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import type { CreateRecipeFieldErrors } from '@presentation/app/create-recipe/model/validation/create-recipe-field-errors';

export interface UseRecipeSaveArgs {
  recipe: EditableRecipe;
  activeDraftId: string;
  setFieldErrors: (errors: CreateRecipeFieldErrors) => void;
}
