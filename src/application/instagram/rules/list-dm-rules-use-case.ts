import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { PageSizes } from '@application/config/page-sizes';
import type { Page } from '@domain/common/page';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/** One page of the viewer's rules, newest first. */
export class ListDmRulesUseCase {
  constructor(private readonly repo: InstagramRepositoryInterface) {}

  execute(page: number): Promise<Result<Page<DmRuleEntity>, Failure>> {
    return this.repo.listRules(page, PageSizes.dmRules);
  }
}
