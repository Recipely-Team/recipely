import { CreatorPlatform } from '@domain/creators/creator-platform';
import type { CreatorTag } from '@domain/creators/creator-tag';
import { instagramProfileUrl, tiktokProfileUrl } from '@presentation/base/constants';

/** Where a verified account lives on its platform — the badge's and the linked row's link. */
export const creatorProfileUrl = (tag: CreatorTag): string =>
  tag.platform === CreatorPlatform.TikTok ? tiktokProfileUrl(tag.handle) : instagramProfileUrl(tag.handle);
