import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import { CreatorClaim } from '@domain/creators/creator-claim';
import { CreatorStatus } from '@domain/creators/creator-status';
import { CreatorTag } from '@domain/creators/creator-tag';

const email = Email.create('cook@example.com');
if (!email.ok) throw new Error('fixture email');

const userWith = (claim?: CreatorClaim | null): UserEntity => {
  const r = UserEntity.create({
    id: 'u-1',
    email: email.value,
    displayName: 'Cook',
    ...(claim === undefined ? {} : { creatorClaim: claim }),
  });
  if (!r.ok) throw new Error('fixture user');
  return r.value;
};

const pendingClaim = (): CreatorClaim => {
  const tag = CreatorTag.create('instagram', 'chef');
  if (!tag.ok) throw new Error('fixture tag');
  const claim = CreatorClaim.create(tag.value, CreatorStatus.Pending);
  if (!claim.ok) throw new Error('fixture claim');
  return claim.value;
};

describe('UserEntity — creator claim', () => {
  it('has no claim and status none when the prop is absent or null', () => {
    expect(userWith().creatorClaim).toBeNull();
    expect(userWith().creatorStatus).toBe(CreatorStatus.None);
    expect(userWith(null).creatorStatus).toBe(CreatorStatus.None);
  });

  it('reports the status of the claim it holds', () => {
    expect(userWith(pendingClaim()).creatorStatus).toBe(CreatorStatus.Pending);
  });

  it('withCreatorClaim returns a new user and leaves the original alone', () => {
    const original = userWith();
    const claimed = original.withCreatorClaim(pendingClaim());

    expect(claimed).not.toBe(original);
    expect(claimed.creatorStatus).toBe(CreatorStatus.Pending);
    expect(original.creatorClaim).toBeNull();
    expect(claimed.equals(original)).toBe(true);
    expect(claimed.withCreatorClaim(null).creatorClaim).toBeNull();
  });

  it('holdsCreatorClaim compares by value, with no claim equal only to no claim', () => {
    const approved = CreatorClaim.create(pendingClaim().tag, CreatorStatus.Approved);
    if (!approved.ok) throw new Error('fixture claim');

    expect(userWith(pendingClaim()).holdsCreatorClaim(pendingClaim())).toBe(true);
    expect(userWith(pendingClaim()).holdsCreatorClaim(approved.value)).toBe(false);
    expect(userWith(pendingClaim()).holdsCreatorClaim(null)).toBe(false);
    expect(userWith().holdsCreatorClaim(pendingClaim())).toBe(false);
    expect(userWith().holdsCreatorClaim(null)).toBe(true);
  });
});
