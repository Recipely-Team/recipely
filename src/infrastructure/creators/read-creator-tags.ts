import type { CreatorTag } from '@domain/creators/creator-tag';
import { orderCreatorTags } from '@domain/creators/order-creator-tags';
import type { CreatorTagDto } from '@infrastructure/creators/dtos/creator-tag-dto';
import { readCreatorTag } from '@infrastructure/creators/read-creator-tag';

/**
 * Public `creatorTags`, read leniently: missing or not a list is "not a
 * creator", an unreadable entry is skipped, and the rest are one per platform,
 * Instagram first.
 */
export const readCreatorTags = (dtos: readonly CreatorTagDto[] | null | undefined): readonly CreatorTag[] => {
  if (!Array.isArray(dtos)) return [];
  const tags = dtos.flatMap((dto) => {
    const tag = readCreatorTag(dto);
    return tag === null ? [] : [tag];
  });
  return orderCreatorTags(tags);
};
