import type { ImportFile } from '@domain/recipes/import-file/import-file';
import type { PickSource } from '@presentation/base/utils/pick-source';

/**
 * Opens the platform's picker and resolves with what was chosen, or an empty
 * list when the user backed out. The one signature both halves of
 * `use-pick-import-files` return.
 */
export type PickImportFilesCallback = (source: PickSource) => Promise<ImportFile[]>;
