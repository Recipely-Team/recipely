import type { CreatorTag } from '@domain/creators/creator-tag';

/** Whether no platform appears twice — a creator has at most one account per platform. */
export const hasOnePerPlatform = (tags: readonly CreatorTag[]): boolean =>
  new Set(tags.map((tag) => tag.platform)).size === tags.length;
