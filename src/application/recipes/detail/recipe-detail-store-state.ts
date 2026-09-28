import type { Failure } from '@core/failure';
import type { RecipeDetailState } from '@application/recipes/detail/recipe-detail-state';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { MediaItem } from '@domain/recipes/media/media-item';

export interface RecipeDetailStoreState {
  byId: Record<string, RecipeDetailState>;
  load: (id: string) => Promise<void>;
  remove: (id: string) => void;
  /** Replaces a cached recipe with the server's newer answer (after a publish or edit). */
  put: (recipe: RecipeEntity) => void;
  /**
   * Adds a photo to a recipe the user owns, then reloads it.
   *
   * The reload is what puts the picture on screen: the gallery renders from
   * the loaded recipe, so appending optimistically would mean holding a second
   * copy of the truth and deciding what to do when the two disagree. The
   * request is the slow part; a refetch after it is not felt.
   *
   * Returns the failure so the screen can say WHICH kind it was — a photo the
   * server refused reads differently from one it could not check.
   */
  addPhoto: (
    recipeId: string,
    fileUri: string,
    fileName: string,
    mimeType: string,
  ) => Promise<Failure | null>;

  /**
   * Removes one photo, then reloads. The cover goes through its own request —
   * it is removed everywhere it appears and the next photo takes its place —
   * so any slide, the cover included, can be taken off.
   */
  removePhoto: (recipeId: string, item: MediaItem) => Promise<Failure | null>;

  /** True while a photo is being uploaded or removed, for the screen's spinner. */
  isPhotoBusy: boolean;

  /** Drops every cached recipe detail. Called when the session ends. */
  clear: () => void;
}
