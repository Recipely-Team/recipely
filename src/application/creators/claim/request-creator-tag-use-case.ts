import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';
import { CreatorTag } from '@domain/creators/creator-tag';
import type { RequestCreatorTagInput } from '@application/creators/claim/request-creator-tag-input';

/**
 * Claims an Instagram or TikTok account for the signed-in user and returns the
 * session holding the new claim.
 *
 * @remarks
 * - **Validates before sending.** A handle that breaks the rules fails here
 *   with `errors.validation.creator_handle` — the key the server would answer
 *   with — without a round trip.
 * - The server decides the resulting status: `pending`, or still `approved`
 *   when the tag is the one already approved.
 */
export class RequestCreatorTagUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  async execute(input: RequestCreatorTagInput): Promise<Result<AuthSessionEntity, Failure>> {
    const tag = CreatorTag.create(input.platform, input.handle);
    if (!tag.ok) return tag;
    return this.repo.requestCreatorTag(tag.value);
  }
}
