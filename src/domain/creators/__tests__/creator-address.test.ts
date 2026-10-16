import { creatorAddress } from '@domain/creators/creator-address';
import { CreatorTag } from '@domain/creators/creator-tag';

/**
 * A creator's page was shared as recipely.net/creators/c75eda90-…, an address
 * nobody can say or remember. It is their approved Instagram handle now.
 */
const tag = (platform: string, handle: string): CreatorTag => {
  const result = CreatorTag.create(platform, handle);
  if (!result.ok) throw new Error('fixture tag');
  return result.value;
};
const ID = 'c75eda90-53e7-4708-b953-06f4b7c2bb2d';

describe('creatorAddress', () => {
  it('is the Instagram handle when the creator has one', () => {
    expect(creatorAddress({ id: ID, creatorTags: [tag('tiktok', 'recipelyapp_tt'), tag('instagram', 'recipelyapp')] })).toBe('recipelyapp');
  });

  it('is the id for a creator with no Instagram handle', () => {
    expect(creatorAddress({ id: ID, creatorTags: [tag('tiktok', 'recipelyapp_tt')] })).toBe(ID);
  });
});
