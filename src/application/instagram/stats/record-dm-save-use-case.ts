import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/** Reports that the recipe a DM carried was saved by the viewer who arrived through it. */
export class RecordDmSaveUseCase {
  constructor(private readonly repo: InstagramRepositoryInterface) {}

  execute(sendId: string, recipeId: string): Promise<Result<void, Failure>> {
    return this.repo.recordDmSave(sendId, recipeId);
  }
}
