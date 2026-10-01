import { comparePlatforms } from '@domain/creators/compare-platforms';
import type { CreatorTag } from '@domain/creators/creator-tag';

/**
 * Approved public tags as a creator shows them: one per platform (the first of
 * a duplicate wins), Instagram first — `[0]` is the primary account, the one
 * drawn in front where only one fits.
 */
export const orderCreatorTags = (tags: readonly CreatorTag[]): readonly CreatorTag[] =>
  tags
    .filter((tag, index) => tags.findIndex((other) => other.platform === tag.platform) === index)
    .sort((a, b) => comparePlatforms(a.platform, b.platform));
