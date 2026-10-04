import type { ValidationFailure } from '@core/failure';
import type { Mapper } from '@core/mapper/mapper';
import { CreatorTag } from '@domain/creators/creator-tag';
import type { CreatorTagDto } from '@infrastructure/creators/dtos/creator-tag-dto';

/** Wire tag -> `CreatorTag`, held to the same platform and handle rules as user input. */
export const toCreatorTag: Mapper<CreatorTagDto, CreatorTag, ValidationFailure> = (dto) =>
  CreatorTag.create(dto.platform, dto.handle);
