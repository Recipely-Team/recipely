import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { CreatorClaimRepositoryInterface } from '@domain/auth/creator-claim-repository-interface';
import type { CreatorTag } from '@domain/creators/creator-tag';
import type { CreatorPlatformType } from '@domain/creators/creator-platform';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import type { AxiosHttpClient } from '@infrastructure/network/http/axios-http-client';
import type { CreatorClaimDto } from '@infrastructure/creators/dtos/creator-claim-dto';
import type { MeCreatorDto } from '@infrastructure/creators/dtos/me-creator-dto';
import { toCreatorClaim } from '@infrastructure/creators/to-creator-claim';
import { readCreatorClaims } from '@infrastructure/creators/read-creator-claims';
import { toCreatorTagRequest } from '@infrastructure/creators/to-creator-tag-request';
import { replaceSessionUser } from '@infrastructure/auth/session/replace-session-user';
import { signedInUserId } from '@infrastructure/auth/session/signed-in-user-id';
import { signedInUser } from '@infrastructure/auth/session/signed-in-user';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';

/**
 * Implements `CreatorClaimRepositoryInterface` against the Recipely backend.
 *
 * @remarks
 * - **Claims belong to whoever asked.** Each call reads the issuing user first
 *   and writes the answer only onto that user (`replaceSessionUser`), so a
 *   sign-out or account switch mid-request cannot hand one user's claim to another.
 * - **A refresh never overwrites a newer local change.** It writes only if the
 *   stored claims are still the ones it read before asking.
 */
export class CreatorClaimRepository implements CreatorClaimRepositoryInterface {
  constructor(
    private readonly http: AxiosHttpClient,
    private readonly storage: SecureTokenStorage,
  ) {}

  async requestCreatorTag(tag: CreatorTag): Promise<Result<AuthSessionEntity, Failure>> {
    const issuer = await signedInUserId(this.storage);
    if (!issuer.ok) return issuer;
    const result = await this.http.put<CreatorClaimDto>(ApiRoutes.me.creator, toCreatorTagRequest(tag));
    if (!result.ok) return result;
    const claim = toCreatorClaim(result.value);
    if (!claim.ok) return claim;
    return replaceSessionUser(this.storage, issuer.value, (user) =>
      ok(user.withCreatorClaims(user.creatorClaims.with(claim.value))),
    );
  }

  async removeCreatorTag(platform: CreatorPlatformType): Promise<Result<AuthSessionEntity, Failure>> {
    const issuer = await signedInUserId(this.storage);
    if (!issuer.ok) return issuer;
    const result = await this.http.delete<void>(ApiRoutes.me.creatorPlatform(platform));
    if (!result.ok) return result;
    return replaceSessionUser(this.storage, issuer.value, (user) =>
      ok(user.withCreatorClaims(user.creatorClaims.without(platform))),
    );
  }

  async refreshCreatorClaim(): Promise<Result<AuthSessionEntity, Failure>> {
    const issuer = await signedInUser(this.storage);
    if (!issuer.ok) return issuer;
    const readBefore = issuer.value.creatorClaims;
    const result = await this.http.get<MeCreatorDto>(ApiRoutes.me.root);
    if (!result.ok) return result;
    const { creatorTags } = result.value;
    return replaceSessionUser(this.storage, issuer.value.id, (user) =>
      ok(
        creatorTags === undefined || !user.holdsCreatorClaims(readBefore)
          ? user
          : user.withCreatorClaims(readCreatorClaims(creatorTags)),
      ),
    );
  }
}
