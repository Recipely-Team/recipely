/**
 * One page the user picked to be read into a recipe: a photo, or a PDF.
 *
 * @remarks
 * - **A reference, not the bytes.** The uri is a local file (native) or a blob
 *   url (web); the repository reads it when it builds the request.
 * - **`sizeBytes` is null when nobody knows it.** A photo re-encoded on the
 *   device has no size until it is read, and the server's limit is the
 *   backstop for that case.
 */
export interface ImportFile {
  uri: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number | null;
}
