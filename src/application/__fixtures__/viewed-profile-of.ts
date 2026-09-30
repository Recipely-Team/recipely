import { CreatorTag } from '@domain/creators/creator-tag';
import { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { ViewedUserProfile } from '@domain/user-profile/viewed-user-profile';

/** An approved Instagram creator's profile as a viewer sees it. */
export const viewedProfileOf = (
  id: string,
  standing: { followerCount?: number; isFollowedByMe?: boolean } = {},
): ViewedUserProfile => {
  const tag = CreatorTag.create('instagram', `chef_${id.replace(/[^a-z0-9]/gi, '_')}`);
  if (!tag.ok) throw new Error('fixture creator tag invalid');
  const profile = UserProfileEntity.create({
    id,
    displayName: `Creator ${id}`,
    bio: 'Weeknight recipes.',
    photoUrl: null,
    recipeCount: 48,
    totalLikes: 31000,
    totalViews: 0,
    joinedAt: new Date('2026-01-01T00:00:00.000Z'),
    creator: tag.value,
  });
  if (!profile.ok) throw new Error('fixture profile invalid');
  return {
    profile: profile.value,
    followerCount: standing.followerCount ?? 12400,
    isFollowedByMe: standing.isFollowedByMe ?? false,
  };
};
