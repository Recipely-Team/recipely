import type { ImportFileBatch } from '@domain/recipes/import-file/import-file-batch';
import { appendFilePart } from '@infrastructure/network/upload/append-file-part';

/** The field the backend's `fileUpload.array('files', 5)` reads. */
export const IMPORT_FILE_FIELD = 'files';

/**
 * Builds the multipart body for `POST /recipes/import/file`.
 *
 * Every page goes under the same `files` field, in the order the user put
 * them: the backend reads photos as the pages of one recipe, first to last.
 */
export const buildImportFileFormData = async (batch: ImportFileBatch): Promise<FormData> => {
  const formData = new FormData();
  for (const file of batch.value) {
    await appendFilePart(formData, IMPORT_FILE_FIELD, {
      uri: file.uri,
      fileName: file.fileName,
      mimeType: file.mimeType,
    });
  }
  return formData;
};
