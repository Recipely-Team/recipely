import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { PageSizes } from '@application/config/page-sizes';
import type { Page } from '@domain/common/page';
import type { DmSend } from '@domain/instagram/activity/dm-send';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/** One page of a rule's matched comments and their replies, newest first. */
export class ListDmSendsUseCase {
  constructor(private readonly repo: InstagramRepositoryInterface) {}

  execute(ruleId: string, page: number): Promise<Result<Page<DmSend>, Failure>> {
    return this.repo.listSends(ruleId, page, PageSizes.dmSends);
  }
}
