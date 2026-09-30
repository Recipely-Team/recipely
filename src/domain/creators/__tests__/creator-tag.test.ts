import { FailureField } from '@core/failure/diagnostic-message';
import { CreatorPlatform } from '@domain/creators/creator-platform';
import { CreatorTag } from '@domain/creators/creator-tag';

const tagOf = (platform: string, handle: string): CreatorTag => {
  const result = CreatorTag.create(platform, handle);
  if (!result.ok) throw new Error('fixture tag invalid');
  return result.value;
};

describe('CreatorTag', () => {
  it('holds the platform and the normalised handle', () => {
    const tag = tagOf(CreatorPlatform.TikTok, '@Chef.Ada');
    expect(tag.platform).toBe(CreatorPlatform.TikTok);
    expect(tag.handle).toBe('chef.ada');
    expect(tag.displayHandle).toBe('@chef.ada');
    expect(tag.toString()).toBe('tiktok:chef.ada');
  });

  it('rejects a platform this build has no word for', () => {
    const result = CreatorTag.create('youtube', 'chef');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.field).toBe(FailureField.creatorPlatform);
  });

  it('applies the handle rules of its platform', () => {
    expect(CreatorTag.create(CreatorPlatform.Instagram, 'a').ok).toBe(true);
    expect(CreatorTag.create(CreatorPlatform.TikTok, 'a').ok).toBe(false);
  });

  it('is equal to a tag of the same platform and handle, however it was typed', () => {
    expect(tagOf('instagram', '@CHEF').equals(tagOf('instagram', 'chef'))).toBe(true);
  });

  it('is not equal across platforms or handles', () => {
    expect(tagOf('instagram', 'chef').equals(tagOf('tiktok', 'chef'))).toBe(false);
    expect(tagOf('instagram', 'chef').equals(tagOf('instagram', 'chef2'))).toBe(false);
  });
});
