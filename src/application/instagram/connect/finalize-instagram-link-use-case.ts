import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { InstagramLinkResult } from '@domain/instagram/connect/instagram-link-result';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/** Links the account with the return link's one-time code (valid ten minutes, this user only). */
export class FinalizeInstagramLinkUseCase {
  constructor(private readonly repo: InstagramRepositoryInterface) {}

  execute(code: string): Promise<Result<InstagramLinkResult, Failure>> {
    return this.repo.finalize(code);
  }
}
