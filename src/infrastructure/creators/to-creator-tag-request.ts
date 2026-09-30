import type { RequestMapper } from '@core/mapper/request-mapper';
import type { CreatorTag } from '@domain/creators/creator-tag';
import type { CreatorTagRequestDto } from '@infrastructure/creators/dtos/creator-tag-request-dto';

/** `CreatorTag` -> the `PUT /me/creator` body; the handle goes out normalised, without `@`. */
export const toCreatorTagRequest: RequestMapper<CreatorTag, CreatorTagRequestDto> = (tag) => ({
  platform: tag.platform,
  handle: tag.handle,
});
