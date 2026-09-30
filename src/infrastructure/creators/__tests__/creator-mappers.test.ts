import { CreatorStatus } from '@domain/creators/creator-status';
import { CreatorTag } from '@domain/creators/creator-tag';
import { toCreatorTag } from '@infrastructure/creators/to-creator-tag';
import { toCreatorClaim } from '@infrastructure/creators/to-creator-claim';
import { readCreatorTag } from '@infrastructure/creators/read-creator-tag';
import { readCreatorClaim } from '@infrastructure/creators/read-creator-claim';
import { toCreatorTagRequest } from '@infrastructure/creators/to-creator-tag-request';

describe('toCreatorTag', () => {
  it('maps a wire tag, normalising the handle', () => {
    const r = toCreatorTag({ platform: 'instagram', handle: '@Chef.Ada' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.platform).toBe('instagram');
      expect(r.value.handle).toBe('chef.ada');
    }
  });

  it('fails on a platform this build does not know', () => {
    expect(toCreatorTag({ platform: 'youtube', handle: 'chef' }).ok).toBe(false);
  });
});

describe('toCreatorClaim', () => {
  it('maps tag and status', () => {
    const r = toCreatorClaim({ platform: 'tiktok', handle: 'chef', status: 'pending' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.tag.platform).toBe('tiktok');
      expect(r.value.status).toBe(CreatorStatus.Pending);
    }
  });

  it('fails on an unknown status', () => {
    expect(toCreatorClaim({ platform: 'tiktok', handle: 'chef', status: 'banned' }).ok).toBe(false);
  });
});

describe('lenient readers', () => {
  it.each([undefined, null])('read %p as no tag and no claim', (dto) => {
    expect(readCreatorTag(dto)).toBeNull();
    expect(readCreatorClaim(dto)).toBeNull();
  });

  it('read an unreadable value as none instead of failing', () => {
    expect(readCreatorTag({ platform: 'youtube', handle: 'chef' })).toBeNull();
    expect(readCreatorClaim({ platform: 'instagram', handle: 'bad handle', status: 'approved' })).toBeNull();
  });

  it('read a valid value through', () => {
    expect(readCreatorTag({ platform: 'instagram', handle: 'chef' })?.handle).toBe('chef');
    expect(readCreatorClaim({ platform: 'instagram', handle: 'chef', status: 'approved' })?.isApproved).toBe(true);
  });
});

describe('toCreatorTagRequest', () => {
  it('sends the platform and the normalised handle without @', () => {
    const tag = CreatorTag.create('instagram', '  @Chef.Ada ');
    if (!tag.ok) throw new Error('fixture');
    expect(toCreatorTagRequest(tag.value)).toEqual({ platform: 'instagram', handle: 'chef.ada' });
  });
});
