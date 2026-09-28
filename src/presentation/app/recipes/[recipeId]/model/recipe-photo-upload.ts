import type { MediaItem } from '@domain/recipes/media/media-item';

/** What {@link useRecipePhotoUpload} hands the screen. Only that pair names it. */
export interface RecipePhotoUpload {
  /** Offers the camera or the library, then uploads what was chosen. */
  pickAndAdd: () => Promise<void>;
  /** Takes one photo off the recipe, the cover included. The caller has already asked the user. */
  remove: (item: MediaItem) => Promise<void>;
  isBusy: boolean;
  /** A localized sentence when something failed, for the screen's dialog. */
  error: string | null;
  onDismissError: () => void;
}
