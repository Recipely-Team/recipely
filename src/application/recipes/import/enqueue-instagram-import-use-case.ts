import { fail } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { InstagramUrl } from '@domain/recipes/import/instagram-url';
import type { ImportJob } from '@domain/recipes/import/import-job';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import type { ImportInstagramRecipeInput } from '@application/recipes/import/import-instagram-recipe-input';

/**
 * Queues an Instagram import and returns a receipt, without waiting for it.
 *
 * @remarks
 * - **Why not just call the old use case.** That one holds a request open for
 *   the 59-128 s the pipeline takes. A phone that backgrounds the app kills the
 *   socket and the result is lost entirely — the work was done and thrown away.
 *   Here the job outlives the request and the user is told when it lands.
 * - **The guards live in {@link InstagramUrl}, not here.** The paste screen
 *   needs the same rules to tell a user what is wrong BEFORE a round trip, and
 *   two copies of "is this an Instagram post link" would have drifted the first
 *   time either was touched. The keys ride on `messageKey`, the same channel
 *   the backend uses, so a locally-refused URL and a server-refused one resolve
 *   through one lookup.
 */
export class EnqueueInstagramImportUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(input: ImportInstagramRecipeInput): Promise<Result<ImportJob, Failure>> {
    const url = InstagramUrl.create(input.url);
    if (!url.ok) return Promise.resolve(fail(url.failure));
    return this.repo.enqueueInstagramImport(url.value.value);
  }
}
