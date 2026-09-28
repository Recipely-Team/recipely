/**
 * The file types a recipe can be read from: five photo formats, or a PDF.
 *
 * The same list the backend's file import accepts; a type outside it is
 * refused on the device with the key the server would have answered with.
 */
export const ImportFileMimeType = {
  Jpeg: 'image/jpeg',
  Png: 'image/png',
  Webp: 'image/webp',
  Heic: 'image/heic',
  Heif: 'image/heif',
  Pdf: 'application/pdf',
} as const;

export type ImportFileMimeTypeType = (typeof ImportFileMimeType)[keyof typeof ImportFileMimeType];
