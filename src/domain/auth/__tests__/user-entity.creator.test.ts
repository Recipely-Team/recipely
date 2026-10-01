import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import { CreatorClaim } from '@domain/creators/creator-claim';
import { CreatorClaims } from '@domain/creators/creator-claims';
import { CreatorStatus } from '@domain/creators/creator-status';
import { CreatorTag } from '@domain/creators/creator-tag';

const email = Email.create('cook@example.com');
if (!email.ok) throw new Error('fixture email');

const claimOf = (platform: string, status: string): CreatorClaim => {
  const tag = CreatorTag.create(platform, 'chef');
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

const userWith = (claims?: CreatorClaims): UserEntity => {
  const r = UserEntity.create({
    id: 'u-1',
    email: email.value,
    displayName: 'Cook',
    ...(claims === undefined ? {} : { creatorClaims: claims }),
  });
  if (!r.ok) throw new Error('fixture user');
  return r.value;
};

describe('UserEntity — creator claims', () => {
  it('holds no claims when the prop is absent, the same empty set on every read', () => {
    const user = userWith();
    expect(user.creatorClaims.isEmpty).toBe(true);
    expect(user.creatorClaims).toBe(user.creatorClaims);
  });

  it('withCreatorClaims returns a new user and leaves the original alone', () => {
    const original = userWith();
    const claimed = original.withCreatorClaims(claimsOf(claimOf('instagram', CreatorStatus.Pending)));

    expect(claimed).not.toBe(original);
    expect(claimed.creatorClaims.forPlatform('instagram')?.isPending).toBe(true);
    expect(original.creatorClaims.isEmpty).toBe(true);
    expect(claimed.equals(original)).toBe(true);
  });

  it('holdsCreatorClaims compares every platform by value', () => {
    const user = userWith(claimsOf(claimOf('instagram', CreatorStatus.Approved), claimOf('tiktok', CreatorStatus.Pending)));

    expect(user.holdsCreatorClaims(claimsOf(claimOf('tiktok', CreatorStatus.Pending), claimOf('instagram', CreatorStatus.Approved)))).toBe(true);
    expect(user.holdsCreatorClaims(claimsOf(claimOf('instagram', CreatorStatus.Approved)))).toBe(false);
    expect(user.holdsCreatorClaims(CreatorClaims.empty())).toBe(false);
    expect(userWith().holdsCreatorClaims(CreatorClaims.empty())).toBe(true);
  });
});
