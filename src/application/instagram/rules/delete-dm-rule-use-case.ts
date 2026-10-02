import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/** Deletes a rule and its history. */
export class DeleteDmRuleUseCase {
  constructor(private readonly repo: InstagramRepositoryInterface) {}

  execute(id: string): Promise<Result<void, Failure>> {
    return this.repo.deleteRule(id);
  }
}
