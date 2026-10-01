import { CreatorPlatform, type CreatorPlatformType } from '@domain/creators/creator-platform';

/** Instagram first, then TikTok — the wire's order and the screen's. */
const ORDER: readonly CreatorPlatformType[] = Object.values(CreatorPlatform);

/** Sort comparator putting platforms in their one display order; claims and public tags both sort by it. */
export const comparePlatforms = (a: CreatorPlatformType, b: CreatorPlatformType): number => ORDER.indexOf(a) - ORDER.indexOf(b);
