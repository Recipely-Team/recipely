import { BaseEntity } from '@core/entity/base-entity';
import type { UserProfileEntityProps } from '@domain/user-profile/user-profile-entity-props';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import type { CreatorTag } from '@domain/creators/creator-tag';
import { hasOnePerPlatform } from '@domain/creators/has-one-per-platform';
import { isBlank } from '@core/guards/type-guards';


/**
 * Domain entity representing a public user profile. Validates that `id`
 * and `displayName` are non-empty before construction.
 */
export class UserProfileEntity extends BaseEntity<UserProfileEntityProps> {
  private constructor(props: UserProfileEntityProps) {
    super(props);
  }

  static create(props: UserProfileEntityProps): Result<UserProfileEntity, ValidationFailure> {
    if (isBlank(props.id)) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.userProfile.idRequired, 'id'));
    }
    if (isBlank(props.displayName)) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.userProfile.displayNameRequired, 'displayName'));
    }
    if (!hasOnePerPlatform(props.creatorTags)) {
      return fail(new ValidationFailure(DiagnosticMessage.creator.duplicateTag, 'creatorTags'));
    }
    return ok(new UserProfileEntity(props));
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get bio(): string | null {
    return this.props.bio;
  }

  get photoUrl(): string | null {
    return this.props.photoUrl;
  }

  get recipeCount(): number {
    return this.props.recipeCount;
  }

  get totalLikes(): number {
    return this.props.totalLikes;
  }

  get totalViews(): number {
    return this.props.totalViews;
  }

  get joinedAt(): Date {
    return this.props.joinedAt;
  }

  /** Approved accounts, one per platform, Instagram first; empty when the user is not a creator. */
  get creatorTags(): readonly CreatorTag[] {
    return this.props.creatorTags;
  }

  get isCreator(): boolean {
    return this.props.creatorTags.length > ValueConstants.zero;
  }
}
