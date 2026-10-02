import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/** Turns a rule on or off. */
export class SetDmRuleEnabledUseCase {
  constructor(private readonly repo: InstagramRepositoryInterface) {}

  execute(id: string, enabled: boolean): Promise<Result<DmRuleEntity, Failure>> {
    return this.repo.updateRule(id, { enabled });
  }
}
