import type { CreatorClaim } from '@domain/creators/creator-claim';
import type { CreatorClaimDto } from '@infrastructure/creators/dtos/creator-claim-dto';
import { toCreatorClaim } from '@infrastructure/creators/to-creator-claim';

/**
 * An optional wire claim, read leniently: missing (an older backend), `null`
 * (status `none`) or unreadable are all "no claim". Signing in must not fail
 * over the creator section of Edit Profile.
 */
export const readCreatorClaim = (dto: CreatorClaimDto | null | undefined): CreatorClaim | null => {
  if (dto === null || dto === undefined) return null;
  const claim = toCreatorClaim(dto);
  return claim.ok ? claim.value : null;
};
