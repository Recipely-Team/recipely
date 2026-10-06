import type { MediaItem } from '@domain/recipes/media/media-item';
import type { RecipeMediaUpload } from '@domain/recipes/media/recipe-media-upload';
import { uploadFileMeta } from '@presentation/base/utils/upload-file-meta';

const RECIPE_FILE_PREFIX = 'recipe';
/** A short random tag (base-36 digits 2–8 of Math.random) keeps two photos saved in one batch apart. */
const RANDOM_RADIX = 36;
const RANDOM_SKIP = 2;
const RANDOM_END = 8;

/**
 * Converts a gallery `MediaItem` into a `RecipeMediaUpload`. The filename is
 * unique per call so multiple photos never collide in the multipart payload.
 */
export const toMediaUpload = (item: MediaItem): RecipeMediaUpload => {
  const unique = `${String(Date.now())}-${Math.random().toString(RANDOM_RADIX).slice(RANDOM_SKIP, RANDOM_END)}`;
  return { uri: item.url, ...uploadFileMeta(item.url, RECIPE_FILE_PREFIX, unique), type: item.type };
};
