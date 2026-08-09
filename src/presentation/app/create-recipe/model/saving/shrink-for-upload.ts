import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import {
  MEDIA_UPLOAD_MAX_EDGE,
  MEDIA_UPLOAD_QUALITY,
} from '@infrastructure/constants/media-upload';

/** What the picker knows about a chosen photo, and all this needs. */
interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
}

/**
 * Brings a freshly picked photo down to something the backend will accept.
 *
 * @remarks
 * - **The bug this fixes.** The picker returns the original capture. On a
 *   recent phone that is 4000px and several megabytes, and it went into the
 *   multipart body untouched — so publishing a recipe with a photo failed with
 *   `errors.validation.file_too_large`, which is a real server answer to a
 *   request the app should never have sent.
 * - **Only the long edge is given.** `manipulateAsync` keeps the aspect ratio
 *   when one dimension is supplied, and asking for both would distort anything
 *   that is not already the target shape.
 * - **A photo already inside the bound is still re-encoded.** It comes back as
 *   a JPEG at a known quality, which is the point: a small HEIC or PNG can
 *   still be large, and "small enough on paper" is not the same as "small".
 * - **Never throws.** A manipulation that fails must not lose the user's photo;
 *   the original URI is returned and the upload proceeds exactly as it did
 *   before. The server's own limit is still the backstop.
 */
export const shrinkForUpload = async (photo: PickedPhoto): Promise<string> => {
  const longestEdge = Math.max(photo.width, photo.height);
  const isWide = photo.width >= photo.height;
  const scale = longestEdge > MEDIA_UPLOAD_MAX_EDGE ? MEDIA_UPLOAD_MAX_EDGE / longestEdge : 1;

  try {
    const result = await manipulateAsync(
      photo.uri,
      scale < 1
        ? [
            {
              resize: isWide
                ? { width: MEDIA_UPLOAD_MAX_EDGE }
                : { height: MEDIA_UPLOAD_MAX_EDGE },
            },
          ]
        : [],
      { compress: MEDIA_UPLOAD_QUALITY, format: SaveFormat.JPEG },
    );
    return result.uri;
  } catch {
    return photo.uri;
  }
};
