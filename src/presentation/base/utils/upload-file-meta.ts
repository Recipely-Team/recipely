import { ValueConstants } from '@core/constants';
import { DEFAULT_IMAGE_MIME, MIME_BY_EXTENSION } from '@infrastructure/constants/image-mime';

const FALLBACK_EXTENSION = 'jpg';
/** Longest extension trusted from a uri ("jpeg", "heic"); anything longer is a path fragment, not an extension. */
const MAX_EXTENSION_LENGTH = 4;

/**
 * A multipart-friendly file name and MIME type for a picked image, from its
 * uri's extension (falling back to JPEG when the uri carries none it trusts).
 * The one copy for avatar, recipe-photo and create-recipe uploads.
 */
export function uploadFileMeta(uri: string, namePrefix: string, nameSuffix: string): { fileName: string; mimeType: string } {
  const ext = uri.split('.').pop()?.toLowerCase() ?? FALLBACK_EXTENSION;
  const safeExt = ext.length > ValueConstants.zero && ext.length <= MAX_EXTENSION_LENGTH ? ext : FALLBACK_EXTENSION;
  return {
    fileName: `${namePrefix}-${nameSuffix}.${safeExt}`,
    mimeType: MIME_BY_EXTENSION[safeExt] ?? DEFAULT_IMAGE_MIME,
  };
}
