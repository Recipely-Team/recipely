import type { ValidationFailure } from '@core/failure';
import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import { ValueConstants } from '@core/constants';
import type { ViewedUserProfile } from '@domain/user-profile/viewed-user-profile';
import type { UserProfileDto } from '@infrastructure/user-profile/user-profile-dto';
import { toUserProfile } from '@infrastructure/user-profile/user-profile-mapper';

/**
 * `GET /users/:id` → the profile plus the caller's follow standing. A backend
 * that omits the follow fields reads as nobody following.
 */
export const toViewedUserProfile: Mapper<UserProfileDto, ViewedUserProfile, ValidationFailure> = (dto) => {
  const profile = toUserProfile(dto);
  if (!profile.ok) return profile;
  return ok({
    profile: profile.value,
    followerCount: dto.followerCount ?? ValueConstants.zero,
    isFollowedByMe: dto.isFollowedByMe ?? false,
  });
};
