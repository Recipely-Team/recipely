import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { CreatorTag } from '@domain/creators/creator-tag';
import type { CreatorPlatformType } from '@domain/creators/creator-platform';

/**
 * The signed-in user's creator tags: claiming, removing and re-reading them.
 * Claims live on the session user, so every call returns the persisted session.
 */
export interface CreatorClaimRepositoryInterface {
  /**
   * Claims `tag` as the signed-in user's account on its platform
   * (`PUT /me/creator`) and returns the persisted session whose user holds the
   * new claim for that platform — `pending`, or still `approved` when the tag
   * is unchanged. The other platform's claim is untouched.
   */
  requestCreatorTag(tag: CreatorTag): Promise<Result<AuthSessionEntity, Failure>>;
  /** Clears `platform`'s claim (`DELETE /me/creator/:platform`) and returns the persisted session without it. */
  removeCreatorTag(platform: CreatorPlatformType): Promise<Result<AuthSessionEntity, Failure>>;
  /**
   * Re-reads every claim from `GET /me`, so an admin's approval or rejection
   * reaches the app without signing in again. A response without the field
   * leaves the stored claims as they are.
   */
  refreshCreatorClaim(): Promise<Result<AuthSessionEntity, Failure>>;
}
