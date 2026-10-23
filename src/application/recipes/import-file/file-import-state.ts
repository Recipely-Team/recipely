import type { FileImportIdle } from '@application/recipes/import-file/states/file-import-idle';
import type { FileImportLoading } from '@application/recipes/import-file/states/file-import-loading';
import type { FileImportLoaded } from '@application/recipes/import-file/states/file-import-loaded';
import type { FileImportError } from '@application/recipes/import-file/states/file-import-error';

/** One reading of picked pages: not started, being read, read into a draft, or refused. */
export type FileImportState =
  | FileImportIdle
  | FileImportLoading
  | FileImportLoaded
  | FileImportError;
