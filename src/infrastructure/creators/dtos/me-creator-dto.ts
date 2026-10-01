import type { CreatorClaimDto } from '@infrastructure/creators/dtos/creator-claim-dto';

// The one field of `GET /me` the creator refresh reads. `undefined` means a
// backend that predates per-platform tags, and leaves the stored claims alone.
export interface MeCreatorDto {
  creatorTags?: CreatorClaimDto[];
}
