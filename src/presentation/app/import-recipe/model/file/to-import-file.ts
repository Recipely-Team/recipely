import type { ImportFile } from '@domain/recipes/import-file/import-file';
import { ImportFileMimeType } from '@domain/recipes/import-file/import-file-mime-type';
import { CharConstants } from '@core/constants';

const TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: ImportFileMimeType.Jpeg,
  jpeg: ImportFileMimeType.Jpeg,
  png: ImportFileMimeType.Png,
  webp: ImportFileMimeType.Webp,
  heic: ImportFileMimeType.Heic,
  heif: ImportFileMimeType.Heif,
  pdf: ImportFileMimeType.Pdf,
};
const EXTENSION_SEPARATOR = '.';

/**
 * A browser `File` — picked or dropped — as a page the import can carry.
 *
 * Browsers leave `type` empty for formats they cannot display, HEIC among
 * them, so the extension is the fallback; a name with neither keeps the empty
 * type, and the batch refuses it as unreadable.
 */
export const toImportFile = (file: File): ImportFile => {
  const extension = file.name.split(EXTENSION_SEPARATOR).pop()?.toLowerCase() ?? CharConstants.empty;
  return {
    uri: URL.createObjectURL(file),
    fileName: file.name,
    mimeType: file.type !== CharConstants.empty ? file.type : (TYPE_BY_EXTENSION[extension] ?? CharConstants.empty),
    sizeBytes: file.size,
  };
};
