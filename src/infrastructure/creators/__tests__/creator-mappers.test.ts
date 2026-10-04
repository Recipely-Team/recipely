import { readCreatorClaims } from '@infrastructure/creators/read-creator-claims';
import { readCreatorTags } from '@infrastructure/creators/read-creator-tags';
import { CreatorStatus } from '@domain/creators/creator-status';
import { CreatorTag } from '@domain/creators/creator-tag';
import { toCreatorTag } from '@infrastructure/creators/to-creator-tag';
import { toCreatorClaim } from '@infrastructure/creators/to-creator-claim';
import { readCreatorTag } from '@infrastructure/creators/read-creator-tag';
import { readCreatorClaim } from '@infrastructure/creators/read-creator-claim';
import { toCreatorTagRequest } from '@infrastructure/creators/to-creator-tag-request';
import type { CreatorClaimDto } from '@infrastructure/creators/dtos/creator-claim-dto';

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

  // A wire object missing `handle` or `platform` threw inside CreatorHandle.normalize
  // and took sign-in (toUser) and cold start (loadSession) down with it.
  it.each([
    { platform: 'instagram' },
    { handle: 'chef' },
    { platform: 'instagram', handle: 42 },
    { platform: 7, handle: 'chef' },
    {},
  ])('read a malformed tag or claim %p as none instead of throwing', (wire) => {
    const dto = { status: 'approved', ...wire } as unknown as CreatorClaimDto;
    expect(readCreatorTag(dto)).toBeNull();
    expect(readCreatorClaim(dto)).toBeNull();
  });

  it('read a claim with a non-string status as none', () => {
    const dto = { platform: 'instagram', handle: 'chef', status: 3 } as unknown as CreatorClaimDto;
    expect(readCreatorClaim(dto)).toBeNull();
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

describe('readCreatorClaims', () => {
  it('reads one claim per platform, Instagram first, skipping what it cannot read', () => {
    const claims = readCreatorClaims([
      { platform: 'tiktok', handle: 'mert.mutfakta', status: 'pending' },
      { platform: 'instagram', handle: 'mertmutfakta', status: 'approved' },
      { platform: 'youtube', handle: 'mert', status: 'approved' },
      { platform: 'tiktok', handle: 'second', status: 'approved' },
    ]);

    expect(claims.all.map((claim) => [claim.tag.platform, claim.tag.handle, claim.status])).toEqual([
      ['instagram', 'mertmutfakta', 'approved'],
      ['tiktok', 'mert.mutfakta', 'pending'],
    ]);
  });

  it('reads missing or a non-list as no claims', () => {
    expect(readCreatorClaims(undefined).isEmpty).toBe(true);
    expect(readCreatorClaims(null).isEmpty).toBe(true);
  });
});

describe('readCreatorTags', () => {
  it('reads public tags Instagram first and drops unreadable ones', () => {
    const tags = readCreatorTags([
      { platform: 'tiktok', handle: 'mert.mutfakta' },
      { platform: 'instagram', handle: 'mertmutfakta' },
      { platform: 'threads', handle: 'mert' },
    ]);

    expect(tags.map((tag) => tag.displayHandle)).toEqual(['@mertmutfakta', '@mert.mutfakta']);
    expect(readCreatorTags(undefined)).toEqual([]);
  });
});
