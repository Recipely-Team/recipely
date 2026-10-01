import type { CreatorPlatformType } from '@domain/creators/creator-platform';
import { comparePlatforms } from '@domain/creators/compare-platforms';
import { CreatorTag } from '@domain/creators/creator-tag';
import { orderCreatorTags } from '@domain/creators/order-creator-tags';
import { toCreatorPlatform } from '@domain/creators/to-creator-platform';

const tagOf = (platform: string, handle: string): CreatorTag => {
  const tag = CreatorTag.create(platform, handle);
  if (!tag.ok) throw new Error('fixture tag');
  return tag.value;
};

describe('orderCreatorTags', () => {
  it('puts Instagram first and keeps the first tag per platform', () => {
    const tags = orderCreatorTags([tagOf('tiktok', 'mert.mutfakta'), tagOf('instagram', 'mertmutfakta'), tagOf('tiktok', 'other')]);
    expect(tags.map((tag) => tag.toString())).toEqual(['instagram:mertmutfakta', 'tiktok:mert.mutfakta']);
  });
});

describe('toCreatorPlatform', () => {
  it('reads the lower-case creator platforms only', () => {
    expect(toCreatorPlatform('instagram')).toBe('instagram');
    expect(toCreatorPlatform('tiktok')).toBe('tiktok');
    expect(toCreatorPlatform('INSTAGRAM')).toBeNull();
    expect(toCreatorPlatform(null)).toBeNull();
  });
});

describe('comparePlatforms', () => {
  it('sorts Instagram before TikTok', () => {
    const platforms: CreatorPlatformType[] = ['tiktok', 'instagram'];
    expect(platforms.sort(comparePlatforms)).toEqual(['instagram', 'tiktok']);
  });
});
