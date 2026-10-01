/**
 * The owner's own Profile shows one approved-creator badge beside the name
 * once any platform is approved — a second approved platform adds nothing,
 * and claims in review or rejected show none (`CreatorClaims.isCreator`).
 */
import { act } from 'react-test-renderer';
import { CreatorClaim } from '@domain/creators/creator-claim';
import { CreatorClaims } from '@domain/creators/creator-claims';
import { CreatorStatus } from '@domain/creators/creator-status';
import { CreatorTag } from '@domain/creators/creator-tag';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { CreatorBadge } from '@presentation/base/widgets/creators/creator-badge';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
import { ProfileIdentity } from '@presentation/app/profile/body/profile-identity';

const claimOf = (platform: string, status: CreatorStatus): CreatorClaim => {
  const tag = CreatorTag.create(platform, 'sefkerem');
  if (!tag.ok) throw new Error('fixture tag invalid');
  const claim = CreatorClaim.create(tag.value, status);
  if (!claim.ok) throw new Error('fixture claim invalid');
  return claim.value;
};

const claimsOf = (...claims: CreatorClaim[]): CreatorClaims => {
  const created = CreatorClaims.create(claims);
  if (!created.ok) throw new Error('fixture claims invalid');
  return created.value;
};

const renderIdentity = (claims: CreatorClaims) =>
  renderComponent(
    <ProfileIdentity
      displayName="Şef Kerem"
      handle="kerem"
      bio=""
      photoUri={undefined}
      isUploading={false}
      onPickAvatar={jest.fn()}
      onAddBio={jest.fn()}
      isCreator={claims.isCreator}
    />,
  );

afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
});

describe('ProfileIdentity — creator badge', () => {
  it('shows one phone-sized badge when one platform is approved', () => {
    const { root } = renderIdentity(claimsOf(claimOf('tiktok', CreatorStatus.Approved), claimOf('instagram', CreatorStatus.Pending)));

    expect(root.findByType(CreatorBadge).props.size).toBe(creatorMarkGeometry.badgeProfile);
  });

  it('still shows one badge when both platforms are approved', () => {
    const { root } = renderIdentity(claimsOf(claimOf('tiktok', CreatorStatus.Approved), claimOf('instagram', CreatorStatus.Approved)));

    expect(root.findAllByType(CreatorBadge)).toHaveLength(1);
  });

  it.each([CreatorStatus.Pending, CreatorStatus.Rejected])('shows no badge while the only claim is %s', (status) => {
    const { root } = renderIdentity(claimsOf(claimOf('tiktok', status)));

    expect(root.findAllByType(CreatorBadge)).toHaveLength(0);
  });
});
