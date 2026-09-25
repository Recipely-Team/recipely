import { fail } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ImportFile } from '@domain/recipes/import-file/import-file';
import { ImportFileBatch } from '@domain/recipes/import-file/import-file-batch';
import type { FileImportReceipt } from '@domain/recipes/import-file/file-import-receipt';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';

/**
 * Reads photos of a recipe's pages, or one PDF, into a draft the editor opens.
 *
 * @remarks
 * - **The batch is checked before it is sent.** Five photos or one PDF, never
 *   both, each within the size limit — {@link ImportFileBatch} holds the rules,
 *   and a refusal carries the key the server would have answered with, so a
 *   local "no" and a remote one read the same.
 * - **Synchronous.** A reading takes seconds, not the minutes a video does, so
 *   there is no job to queue and no notification to wait for.
 */
export class ImportRecipeFromFilesUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(files: readonly ImportFile[]): Promise<Result<FileImportReceipt, Failure>> {
    const batch = ImportFileBatch.create(files);
    if (!batch.ok) return Promise.resolve(fail(batch.failure));
    return this.repo.importRecipeFromFiles(batch.value);
  }
}
