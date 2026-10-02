import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { ValidationFailure } from '@core/failure';
import { CreatorTagOutcome } from '@domain/instagram/connect/creator-tag-outcome';
import type { InstagramLinkResult } from '@domain/instagram/connect/instagram-link-result';
import type { InstagramFinalizeDto } from '@infrastructure/instagram/dtos/instagram-finalize-dto';
import { toInstagramConnection } from '@infrastructure/instagram/read/to-instagram-connection';
import { readOneOf } from '@infrastructure/instagram/read/read-one-of';

/** `POST /me/instagram/finalize` → `InstagramLinkResult`. */
export const toInstagramLinkResult: Mapper<InstagramFinalizeDto, InstagramLinkResult, ValidationFailure> = (dto) => {
  const connection = toInstagramConnection(dto.connection);
  if (!connection.ok) return connection;
  const creatorTag = readOneOf(CreatorTagOutcome, dto.creatorTag, 'creatorTag');
  if (!creatorTag.ok) return creatorTag;
  return ok({ connection: connection.value, creatorTag: creatorTag.value });
};
