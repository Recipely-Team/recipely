/**
 * The owner's own Profile shows the same verified creator chip as their
 * public page — and only once the claim is approved (`approvedTag`).
 */
import { act } from 'react-test-renderer';
import { CreatorClaim } from '@domain/creators/creator-claim';
import { CreatorStatus } from '@domain/creators/creator-status';
import { CreatorTag } from '@domain/creators/creator-tag';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { CreatorTagChip } from '@presentation/base/widgets/creators/creator-tag-chip';
import { ProfileIdentity } from '@presentation/app/profile/body/profile-identity';

const claimOf = (status: CreatorStatus): CreatorClaim => {
  const tag = CreatorTag.create('tiktok', 'sefkerem');
  if (!tag.ok) throw new Error('fixture tag invalid');
  const claim = CreatorClaim.create(tag.value, status);
  if (!claim.ok) throw new Error('fixture claim invalid');
  return claim.value;
};

const renderIdentity = (claim: CreatorClaim) =>
  renderComponent(
    <ProfileIdentity
      displayName="Şef Kerem"
      handle="kerem"
      bio=""
      photoUri={undefined}
      isUploading={false}
      onPickAvatar={jest.fn()}
      onAddBio={jest.fn()}
      creatorTag={claim.approvedTag}
    />,
  );

afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
});

describe('ProfileIdentity — creator badge', () => {
  it('shows the verified chip for an approved claim', () => {
    const { root } = renderIdentity(claimOf(CreatorStatus.Approved));

    const tag = root.findByType(CreatorTagChip).props.tag;
    expect(tag instanceof CreatorTag && tag.displayHandle).toBe('@sefkerem');
  });

  it.each([CreatorStatus.Pending, CreatorStatus.Rejected])('shows no chip while the claim is %s', (status) => {
    const { root } = renderIdentity(claimOf(status));

    expect(root.findAllByType(CreatorTagChip)).toHaveLength(0);
  });
});
