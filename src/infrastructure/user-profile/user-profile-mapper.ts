import type { ValidationFailure } from '@core/failure';
import type { Mapper } from '@core/mapper/mapper';
import { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { UserProfileDto } from '@infrastructure/user-profile/user-profile-dto';

/**
 * Maps a `UserProfileDto` from the API into a domain `UserProfileEntity` entity.
 * The wire `joinedAt` ISO string is parsed into a `Date`; follow-related
 * fields on the DTO are intentionally dropped (not part of the domain model).
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
  });
