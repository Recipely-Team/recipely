import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { ValidationFailure } from '@core/failure';
import { InstagramMediaType } from '@domain/instagram/instagram-media-type';
import type { InstagramMedia } from '@domain/instagram/instagram-media';
import type { InstagramMediaDto } from '@infrastructure/instagram/dtos/instagram-media-dto';
import { readOneOf } from '@infrastructure/instagram/read/read-one-of';

/** A post or Reel → `InstagramMedia`; an unknown media type skips the row. */
export const toInstagramMedia: Mapper<InstagramMediaDto, InstagramMedia, ValidationFailure> = (dto) => {
  const mediaType = readOneOf(InstagramMediaType, dto.mediaType, 'mediaType');
  if (!mediaType.ok) return mediaType;
  return ok({ id: dto.id, mediaType: mediaType.value, thumbnailUrl: dto.thumbnailUrl, caption: dto.caption, permalink: dto.permalink });
};
