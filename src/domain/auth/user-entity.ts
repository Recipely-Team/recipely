import { BaseEntity } from '@core/entity/base-entity';
import type { UserEntityProps } from '@domain/auth/user-entity-props';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { Email } from '@domain/common/email';
import { ValueConstants } from '@core/constants';


/**
 * Domain entity representing an authenticated application user. Validates that
 * `id` and `displayName` are non-empty before construction.
 */
export class UserEntity extends BaseEntity<UserEntityProps> {
  private constructor(props: UserEntityProps) {
    super(props);
  }

  static create(props: UserEntityProps): Result<UserEntity, ValidationFailure> {
    if (props.id.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.user.idRequired, 'id'));
    }
    if (props.displayName.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.user.displayNameRequired, 'displayName'));
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
