/**
 * The MIME type an image extension maps to.
 *
 * @remarks
 * A picker hands back a file URI, and the multipart part needs a content type
 * the backend will accept — the extension is the only clue either end has.
 * This table was written out twice, once for the avatar upload and once for
 * recipe media, so an extension added to one was silently rejected by the other.
 */
export const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

/** What to send when the URI carries no extension we recognise. */
export const DEFAULT_IMAGE_MIME = 'image/jpeg';
