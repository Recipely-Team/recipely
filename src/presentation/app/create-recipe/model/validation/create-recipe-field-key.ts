import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';

/**
 * Every `EditableRecipe` field this screen renders as its own input (and can
 * therefore highlight individually). `media` is excluded — photos are a
 * gallery, not a single bindable field, and the backend's cover-image
 * requirement is already surfaced via the rejected-save dialog.
 */
export type CreateRecipeFieldKey = Exclude<keyof EditableRecipe, 'media'>;
