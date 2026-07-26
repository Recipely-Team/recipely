import { BaseEntity } from '@core/entity/base-entity';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { ValueConstants } from '@core/constants';

export interface UserProfileProps {
  id: string;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  recipeCount: number;
  totalLikes: number;
  totalViews: number;
  joinedAt: Date;
}

/**
 * Domain entity representing a public user profile. Validates that `id`
 * and `displayName` are non-empty before construction.
 */
export class UserProfileEntity extends BaseEntity<UserProfileProps> {
  private constructor(props: UserProfileProps) {
    super(props);
  }

  static create(props: UserProfileProps): Result<UserProfileEntity, ValidationFailure> {
    if (props.id.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure('UserProfile id must be non-empty', 'id'));
    }
    if (props.displayName.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure('UserProfile displayName must be non-empty', 'displayName'));
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
}
