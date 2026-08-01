import type { MediaItem } from '@domain/recipes/media/media-item';
import {
  MIME_BY_EXTENSION,
  DEFAULT_IMAGE_MIME,
} from '@infrastructure/constants/image-mime';
import type { RecipeMediaUpload } from '@domain/recipes/media/recipe-media-upload';
import { ValueConstants } from '@core/constants';

/**
 * Converts a gallery `MediaItem` into a `RecipeMediaUpload`. The filename is
 * unique per call so multiple photos never collide in the multipart payload.
 */
export const toMediaUpload = (item: MediaItem): RecipeMediaUpload => {
  const ext = item.url.split('.').pop()?.toLowerCase() ?? 'jpg';
  const safeExt = ext.length > ValueConstants.zero && ext.length <= 4 ? ext : 'jpg';
  return {
    uri: item.url,
    fileName: `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`,
    mimeType: MIME_BY_EXTENSION[safeExt] ?? DEFAULT_IMAGE_MIME,
    type: item.type,
  };
};
