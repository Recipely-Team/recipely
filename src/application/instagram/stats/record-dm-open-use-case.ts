import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/** Reports that a DM's recipe link was opened, for the creator's stats. */
export class RecordDmOpenUseCase {
  constructor(private readonly repo: InstagramRepositoryInterface) {}

  execute(sendId: string): Promise<Result<void, Failure>> {
    return this.repo.recordDmOpen(sendId);
  }
}
