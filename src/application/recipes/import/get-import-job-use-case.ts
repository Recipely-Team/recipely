import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ImportJob } from '@domain/recipes/import/import-job';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';

/**
 * Reads where a queued Instagram import has got to.
 *
 * @remarks
 * The completion notification is what the user is promised, so this is not the
 * delivery mechanism — it is what lets the screen say something true while they
 * choose to stand and watch.
 */
export class GetImportJobUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(id: string): Promise<Result<ImportJob, Failure>> {
    return this.repo.getImportJob(id);
  }
}
