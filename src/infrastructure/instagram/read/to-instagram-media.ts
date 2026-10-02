import type { Mapper } from '@core/mapper/mapper';
import { fail, ok } from '@core/result/result-helpers';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { InstagramMediaType } from '@domain/instagram/instagram-media-type';
import type { InstagramMedia } from '@domain/instagram/instagram-media';
import type { InstagramMediaDto } from '@infrastructure/instagram/dtos/instagram-media-dto';
import { readOneOf } from '@infrastructure/instagram/read/read-one-of';

/**
 * A post or Reel → `InstagramMedia`. Never drops a post: an unknown media
 * type reads as an image, and an empty `thumbnailUrl` as none — the picker
 * draws a glyph for it. Only a row without an id (nothing a rule could point
 * at) is refused.
 */
export const toInstagramMedia: Mapper<InstagramMediaDto, InstagramMedia, ValidationFailure> = (dto) => {
  if (dto.id.trim().length === ValueConstants.zero) {
    return fail(new ValidationFailure(DiagnosticMessage.instagram.sourceInvalid('media id', dto.id), 'id'));
  }
  const mediaType = readOneOf(InstagramMediaType, dto.mediaType, 'mediaType');
  const thumbnailUrl = dto.thumbnailUrl !== null && dto.thumbnailUrl.trim().length > ValueConstants.zero ? dto.thumbnailUrl : null;
  return ok({
    id: dto.id,
    mediaType: mediaType.ok ? mediaType.value : InstagramMediaType.Image,
    thumbnailUrl,
    caption: dto.caption,
    permalink: dto.permalink,
  });
};
