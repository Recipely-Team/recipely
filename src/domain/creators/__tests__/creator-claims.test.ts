import { CreatorClaim } from '@domain/creators/creator-claim';
import { CreatorClaims } from '@domain/creators/creator-claims';
import { CreatorStatus } from '@domain/creators/creator-status';
import { CreatorTag } from '@domain/creators/creator-tag';

const claimOf = (platform: string, status: string, handle = 'chef'): CreatorClaim => {
  const tag = CreatorTag.create(platform, handle);
  if (!tag.ok) throw new Error('fixture tag');
  const claim = CreatorClaim.create(tag.value, status);
  if (!claim.ok) throw new Error('fixture claim');
  return claim.value;
};

const claimsOf = (...claims: CreatorClaim[]): CreatorClaims => {
  const r = CreatorClaims.create(claims);
  if (!r.ok) throw new Error('fixture claims');
  return r.value;
};

describe('CreatorClaims', () => {
  it('keeps one claim per platform, Instagram first', () => {
    const claims = claimsOf(claimOf('tiktok', CreatorStatus.Pending), claimOf('instagram', CreatorStatus.Approved));

    expect(claims.all.map((claim) => claim.tag.platform)).toEqual(['instagram', 'tiktok']);
    expect(claims.forPlatform('tiktok')?.isPending).toBe(true);
  });

  it('refuses a second claim for a platform', () => {
    expect(CreatorClaims.create([claimOf('instagram', CreatorStatus.Pending), claimOf('instagram', CreatorStatus.Approved, 'other')]).ok).toBe(false);
  });

  it('has no claim for an unclaimed platform — absent is "none"', () => {
    expect(claimsOf(claimOf('instagram', CreatorStatus.Pending)).forPlatform('tiktok')).toBeNull();
    expect(CreatorClaims.empty().isEmpty).toBe(true);
  });

  it('is a creator once any platform is approved, and lists only approved tags', () => {
    expect(claimsOf(claimOf('instagram', CreatorStatus.Pending), claimOf('tiktok', CreatorStatus.Rejected)).isCreator).toBe(false);
    const mixed = claimsOf(claimOf('instagram', CreatorStatus.Pending), claimOf('tiktok', CreatorStatus.Approved));
    expect(mixed.isCreator).toBe(true);
    expect(mixed.approvedTags.map((tag) => tag.platform)).toEqual(['tiktok']);
  });

  it('with replaces a platform\'s claim and without clears it, leaving the other platform', () => {
    const start = claimsOf(claimOf('instagram', CreatorStatus.Approved), claimOf('tiktok', CreatorStatus.Pending));
    const replaced = start.with(claimOf('tiktok', CreatorStatus.Approved, 'new'));

    expect(replaced.all).toHaveLength(2);
    expect(replaced.forPlatform('tiktok')?.tag.handle).toBe('new');
    expect(replaced.without('instagram').all.map((claim) => claim.tag.platform)).toEqual(['tiktok']);
    expect(start.forPlatform('tiktok')?.isPending).toBe(true);
  });

  it('compares claim by claim', () => {
    const a = claimsOf(claimOf('instagram', CreatorStatus.Pending));
    expect(a.equals(claimsOf(claimOf('instagram', CreatorStatus.Pending)))).toBe(true);
    expect(a.equals(claimsOf(claimOf('instagram', CreatorStatus.Approved)))).toBe(false);
    expect(a.equals(CreatorClaims.empty())).toBe(false);
  });
});
