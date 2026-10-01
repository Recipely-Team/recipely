import { CreatorPlatform, type CreatorPlatformType } from '@domain/creators/creator-platform';
import type { CreatorTag } from '@domain/creators/creator-tag';

const PLATFORM_ORDER: readonly CreatorPlatformType[] = Object.values(CreatorPlatform);

/**
 * Approved public tags as a creator shows them: one per platform (the first of
 * a duplicate wins), Instagram first — `[0]` is the primary account, the one
 * drawn in front where only one fits.
 */
export const orderCreatorTags = (tags: readonly CreatorTag[]): readonly CreatorTag[] => {
  const byPlatform = new Map<CreatorPlatformType, CreatorTag>();
  for (const tag of tags) {
    if (!byPlatform.has(tag.platform)) byPlatform.set(tag.platform, tag);
  }
  return PLATFORM_ORDER.flatMap((platform) => {
    const tag = byPlatform.get(platform);
    return tag === undefined ? [] : [tag];
  });
};
