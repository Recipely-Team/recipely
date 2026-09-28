import type { ImportFile } from '@domain/recipes/import-file/import-file';

/** A picked page as the picker grid holds it: the file, and a key that survives reordering. */
export interface FilePage {
  key: string;
  file: ImportFile;
}
