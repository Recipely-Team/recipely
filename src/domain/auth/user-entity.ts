import { BaseEntity } from '@core/entity/base-entity';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { Email } from '@domain/common/email';
import { ValueConstants } from '@core/constants';

export interface UserProps {
  id: string;
  email: Email;
  displayName: string;
  photoUrl?: string;
  bio?: string;
}

/**
 * Domain entity representing an authenticated application user. Validates that
 * `id` and `displayName` are non-empty before construction.
 */
export class UserEntity extends BaseEntity<UserProps> {
  private constructor(props: UserProps) {
    super(props);
  }

  static create(props: UserProps): Result<UserEntity, ValidationFailure> {
    if (props.id.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure('User id must be non-empty', 'id'));
    }
    if (props.displayName.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure('User displayName must be non-empty', 'displayName'));
    }
    return ok(new UserEntity(props));
  }

  get email(): Email {
    return this.props.email;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get photoUrl(): string | undefined {
    return this.props.photoUrl;
  }

  get bio(): string | undefined {
    return this.props.bio;
  }
}
