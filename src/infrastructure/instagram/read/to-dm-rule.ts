import type { Mapper } from '@core/mapper/mapper';
import type { ValidationFailure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';
import type { DmRuleDto } from '@infrastructure/instagram/dtos/dm-rule-dto';
import { readDate } from '@infrastructure/instagram/read/read-date';

/** A rule → `DmRuleEntity`. */
export const toDmRule: Mapper<DmRuleDto, DmRuleEntity, ValidationFailure> = (dto) =>
  DmRuleEntity.create({
    id: dto.id,
    mediaId: dto.mediaId,
    media: { permalink: dto.media.permalink, thumbnailUrl: dto.media.thumbnailUrl, caption: dto.media.caption },
    keywords: dto.keywords,
    recipeId: dto.recipeId,
    recipe: dto.recipe === null ? null : { id: dto.recipe.id, name: dto.recipe.name, image: dto.recipe.image },
    dmText: dto.dmText,
    publicReplyText: dto.publicReplyText,
    enabled: dto.enabled,
    sentCount: dto.sentCount,
    createdAt: readDate(dto.createdAt) ?? new Date(ValueConstants.zero),
  });
