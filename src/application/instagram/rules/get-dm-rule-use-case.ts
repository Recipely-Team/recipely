import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/** One rule by id, for the editor and the Activity screen opened by link. */
export class GetDmRuleUseCase {
  constructor(private readonly repo: InstagramRepositoryInterface) {}

  execute(id: string): Promise<Result<DmRuleEntity, Failure>> {
    return this.repo.getRule(id);
  }
}
