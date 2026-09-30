import { isString } from '@core/guards/type-guards';
import type { CreatorTag } from '@domain/creators/creator-tag';
import type { CreatorTagDto } from '@infrastructure/creators/dtos/creator-tag-dto';
import { toCreatorTag } from '@infrastructure/creators/to-creator-tag';

/**
 * An optional wire tag, read leniently: missing (an older backend), `null`,
 * or unreadable (a platform this build has no word for, a field missing or
 * not a string) are all "no tag". A profile must not fail to open over its
 * badge — and the domain's handle rules assume a string, so the shape is
 * checked here first.
 */
export const readCreatorTag = (dto: CreatorTagDto | null | undefined): CreatorTag | null => {
  if (dto === null || dto === undefined || !isString(dto.platform) || !isString(dto.handle)) return null;
  const tag = toCreatorTag(dto);
  return tag.ok ? tag.value : null;
};
