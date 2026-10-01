/**
 * The owner's own Profile shows the approved-creator badge beside the name —
 * and only once the claim is approved (`approvedTag`).
 */
import { act } from 'react-test-renderer';
import { CreatorClaim } from '@domain/creators/creator-claim';
import { CreatorStatus } from '@domain/creators/creator-status';
import { CreatorTag } from '@domain/creators/creator-tag';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { CreatorBadge } from '@presentation/base/widgets/creators/creator-badge';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
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
  it('shows the phone-sized approved badge for an approved claim', () => {
    const { root } = renderIdentity(claimOf(CreatorStatus.Approved));

    expect(root.findByType(CreatorBadge).props.size).toBe(creatorMarkGeometry.badgeProfile);
  });

  it.each([CreatorStatus.Pending, CreatorStatus.Rejected])('shows no badge while the claim is %s', (status) => {
    const { root } = renderIdentity(claimOf(status));

    expect(root.findAllByType(CreatorBadge)).toHaveLength(0);
  });
});
