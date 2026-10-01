import { CreatorClaims } from '@domain/creators/creator-claims';
import type { CreatorClaimDto } from '@infrastructure/creators/dtos/creator-claim-dto';
import { readCreatorClaim } from '@infrastructure/creators/read-creator-claim';

/**
 * The owner's `creatorTags`, read leniently: missing, not a list, an
 * unreadable entry or a second entry for a platform are each skipped rather
 * than failing the sign-in — the creator section must never cost the session.
 */
export const readCreatorClaims = (dtos: readonly CreatorClaimDto[] | null | undefined): CreatorClaims => {
  if (!Array.isArray(dtos)) return CreatorClaims.empty();
  let claims = CreatorClaims.empty();
  for (const dto of dtos) {
    const claim = readCreatorClaim(dto);
    if (claim !== null && claims.forPlatform(claim.tag.platform) === null) claims = claims.with(claim);
  }
  return claims;
};
