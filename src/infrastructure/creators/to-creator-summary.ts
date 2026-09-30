import type { ValidationFailure } from '@core/failure';
import type { Mapper } from '@core/mapper/mapper';
import { flatMapResult } from '@core/result/result-helpers';
import { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import type { CreatorSummaryDto } from '@infrastructure/creators/dtos/creator-summary-dto';
import { toCreatorTag } from '@infrastructure/creators/to-creator-tag';

/** One `GET /users/creators` item -> `CreatorSummaryEntity`; the tag is required here. */
export const toCreatorSummary: Mapper<CreatorSummaryDto, CreatorSummaryEntity, ValidationFailure> = (
  dto,
) =>
  flatMapResult(toCreatorTag(dto.creator), (creator) =>
    CreatorSummaryEntity.create({
      id: dto.id,
      displayName: dto.displayName,
      photoUrl: dto.photoUrl,
      creator,
      recipeCount: dto.recipeCount,
      followerCount: dto.followerCount,
    }),
  );
