import { CreatorClaim } from '@domain/creators/creator-claim';
import { CreatorStatus } from '@domain/creators/creator-status';
import { CreatorTag } from '@domain/creators/creator-tag';

const tagOf = (platform: string, handle: string): CreatorTag => {
  const result = CreatorTag.create(platform, handle);
  if (!result.ok) throw new Error('fixture tag invalid');
  return result.value;
};

const claimOf = (status: string, tag = tagOf('instagram', 'chef')): CreatorClaim => {
  const result = CreatorClaim.create(tag, status);
  if (!result.ok) throw new Error('fixture claim invalid');
  return result.value;
};

describe('CreatorClaim', () => {
  it.each([CreatorStatus.Pending, CreatorStatus.Approved, CreatorStatus.Rejected])(
    'accepts status %s',
    (status) => {
      expect(claimOf(status).status).toBe(status);
    },
  );

  it('refuses none, which is the absence of a claim', () => {
    expect(CreatorClaim.create(tagOf('instagram', 'chef'), CreatorStatus.None).ok).toBe(false);
  });

  it('refuses a status it does not know', () => {
    expect(CreatorClaim.create(tagOf('instagram', 'chef'), 'banned').ok).toBe(false);
  });

  it('answers which review state it is in', () => {
    expect(claimOf(CreatorStatus.Pending).isPending).toBe(true);
    expect(claimOf(CreatorStatus.Approved).isApproved).toBe(true);
    expect(claimOf(CreatorStatus.Rejected).isRejected).toBe(true);
    expect(claimOf(CreatorStatus.Pending).isApproved).toBe(false);
  });

  it('offers its tag as the badge only once approved', () => {
    expect(claimOf(CreatorStatus.Approved).approvedTag?.handle).toBe('chef');
    expect(claimOf(CreatorStatus.Pending).approvedTag).toBeNull();
    expect(claimOf(CreatorStatus.Rejected).approvedTag).toBeNull();
  });

  describe('keepsApprovalFor', () => {
    it('is true for the same platform and handle on an approved claim', () => {
      expect(claimOf(CreatorStatus.Approved).keepsApprovalFor(tagOf('instagram', '@Chef'))).toBe(true);
    });

    it('is false for any change to an approved claim', () => {
      const approved = claimOf(CreatorStatus.Approved);
      expect(approved.keepsApprovalFor(tagOf('instagram', 'chef2'))).toBe(false);
      expect(approved.keepsApprovalFor(tagOf('tiktok', 'chef'))).toBe(false);
    });

    it('is false for a claim that is not approved yet', () => {
      expect(claimOf(CreatorStatus.Pending).keepsApprovalFor(tagOf('instagram', 'chef'))).toBe(false);
    });
  });

  it('compares tag and status', () => {
    expect(claimOf(CreatorStatus.Pending).equals(claimOf(CreatorStatus.Pending))).toBe(true);
    expect(claimOf(CreatorStatus.Pending).equals(claimOf(CreatorStatus.Approved))).toBe(false);
  });
});
