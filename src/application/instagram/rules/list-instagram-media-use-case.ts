import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import { PageSizes } from '@application/config/page-sizes';
import type { Page } from '@domain/common/page';
import type { InstagramMedia } from '@domain/instagram/instagram-media';
import { DmRuleLimits } from '@domain/instagram/dm/dm-rule-limits';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/** One page of the connected account's posts and Reels; the server serves no page past 20, so the 20th says it is the last. */
export class ListInstagramMediaUseCase {
  constructor(private readonly repo: InstagramRepositoryInterface) {}

  async execute(page: number): Promise<Result<Page<InstagramMedia>, Failure>> {
    const result = await this.repo.listMedia(page, PageSizes.instagramMedia);
    if (!result.ok) return result;
    return ok({ ...result.value, hasMore: result.value.hasMore && result.value.page < DmRuleLimits.MediaPagesMax });
  }
}
