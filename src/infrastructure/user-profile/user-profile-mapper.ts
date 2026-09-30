import type { ValidationFailure } from '@core/failure';
import type { Mapper } from '@core/mapper/mapper';
import { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { UserProfileDto } from '@infrastructure/user-profile/user-profile-dto';
import { readCreatorTag } from '@infrastructure/creators/read-creator-tag';

/**
 * Maps a `UserProfileDto` from the API into a domain `UserProfileEntity` entity.
 * The wire `joinedAt` ISO string is parsed into a `Date`; the follow fields
 * are not the entity's — `toViewedUserProfile` reads them.
 * A missing or unreadable `creator` maps to `null` rather than failing the profile.
 */
export const toUserProfile: Mapper<UserProfileDto, UserProfileEntity, ValidationFailure> = (
  dto,
) =>
  UserProfileEntity.create({
    id: dto.id,
    displayName: dto.displayName,
    bio: dto.bio,
    photoUrl: dto.photoUrl,
    recipeCount: dto.recipeCount,
    totalLikes: dto.totalLikes,
    totalViews: dto.totalViews,
    joinedAt: new Date(dto.joinedAt),
    creator: readCreatorTag(dto.creator),
  });
