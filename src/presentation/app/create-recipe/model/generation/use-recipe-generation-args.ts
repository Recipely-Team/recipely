import type { Dispatch, SetStateAction } from 'react';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';

export interface UseRecipeGenerationArgs {
  recipe: EditableRecipe;
  setRecipe: Dispatch<SetStateAction<EditableRecipe>>;
  activeDraftId: string;
  draftId: string | undefined;
  importUrl: string | undefined;
}
