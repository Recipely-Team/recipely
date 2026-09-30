import type { CreatorClaimDto } from '@infrastructure/creators/dtos/creator-claim-dto';

// The one field of `GET /me` the creator refresh reads. `undefined` means a
// backend that predates creator tags, and leaves the stored claim alone.
export interface MeCreatorDto {
  creator?: CreatorClaimDto | null;
}
