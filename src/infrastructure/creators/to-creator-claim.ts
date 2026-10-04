import type { ValidationFailure } from '@core/failure';
import type { Mapper } from '@core/mapper/mapper';
import { flatMapResult } from '@core/result/result-helpers';
import { CreatorClaim } from '@domain/creators/creator-claim';
import type { CreatorClaimDto } from '@infrastructure/creators/dtos/creator-claim-dto';
import { toCreatorTag } from '@infrastructure/creators/to-creator-tag';

/** Wire claim -> `CreatorClaim`: a valid tag plus a known review status. */
export const toCreatorClaim: Mapper<CreatorClaimDto, CreatorClaim, ValidationFailure> = (dto) =>
  flatMapResult(toCreatorTag(dto), (tag) => CreatorClaim.create(tag, dto.status));
