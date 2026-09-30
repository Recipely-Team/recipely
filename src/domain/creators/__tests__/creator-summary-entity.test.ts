import { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import type { CreatorSummaryEntityProps } from '@domain/creators/creator-summary-entity-props';
import { CreatorTag } from '@domain/creators/creator-tag';

const tag = CreatorTag.create('instagram', 'chef.ada');
if (!tag.ok) throw new Error('fixture tag invalid');

const props: CreatorSummaryEntityProps = {
  id: 'u-1',
  displayName: 'Ada',
  photoUrl: null,
  creator: tag.value,
  recipeCount: 4,
  followerCount: 120,
};

describe('CreatorSummaryEntity', () => {
  it('exposes the strip fields', () => {
    const result = CreatorSummaryEntity.create(props);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBe('u-1');
    expect(result.value.displayName).toBe('Ada');
    expect(result.value.photoUrl).toBeNull();
    expect(result.value.creator.displayHandle).toBe('@chef.ada');
    expect(result.value.recipeCount).toBe(4);
    expect(result.value.followerCount).toBe(120);
  });

  it('refuses a blank id or display name', () => {
    expect(CreatorSummaryEntity.create({ ...props, id: ' ' }).ok).toBe(false);
    expect(CreatorSummaryEntity.create({ ...props, displayName: '' }).ok).toBe(false);
  });

  it('is equal to another summary of the same user', () => {
    const a = CreatorSummaryEntity.create(props);
    const b = CreatorSummaryEntity.create({ ...props, followerCount: 999 });
    if (!a.ok || !b.ok) throw new Error('fixture');
    expect(a.value.equals(b.value)).toBe(true);
  });
});
