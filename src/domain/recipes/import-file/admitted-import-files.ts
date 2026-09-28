import type { Failure } from '@core/failure';
import type { ImportFile } from '@domain/recipes/import-file/import-file';

/**
 * The outcome of adding files to a picked batch: the batch as it now stands,
 * and why some of what was offered did not get in (null when all of it did).
 *
 * The files already picked stay first and in their order, so whatever follows
 * them is exactly what was added.
 */
export interface AdmittedImportFiles {
  files: readonly ImportFile[];
  failure: Failure | null;
}
