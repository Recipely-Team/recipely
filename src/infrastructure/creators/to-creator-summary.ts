import type { ValidationFailure } from '@core/failure';
import type { Mapper } from '@core/mapper/mapper';
import { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import type { CreatorSummaryDto } from '@infrastructure/creators/dtos/creator-summary-dto';
import { readCreatorTags } from '@infrastructure/creators/read-creator-tags';

/**
 * One `GET /users/creators` item -> `CreatorSummaryEntity`. Unreadable tags
 * are dropped; an item left with none fails, and the page skips it.
 */
export const toCreatorSummary: Mapper<CreatorSummaryDto, CreatorSummaryEntity, ValidationFailure> = (dto) =>
  CreatorSummaryEntity.create({
    id: dto.id,
    displayName: dto.displayName,
    photoUrl: dto.photoUrl,
    creatorTags: readCreatorTags(dto.creatorTags),
    recipeCount: dto.recipeCount,
    followerCount: dto.followerCount,
  });
