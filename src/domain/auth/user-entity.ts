import { BaseEntity } from '@core/entity/base-entity';
import type { UserEntityProps } from '@domain/auth/user-entity-props';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { Email } from '@domain/common/email';
import { ValueConstants } from '@core/constants';
import { CreatorClaims } from '@domain/creators/creator-claims';

/** One shared empty collection, so a user without claims answers the same reference each read. */
const NO_CLAIMS = CreatorClaims.empty();


/**
 * Domain entity representing an authenticated application user. Validates that
 * `id` and `displayName` are non-empty before construction.
 *
 * @remarks
 * - **The creator claims are the user's own view**, one per platform. Pending
 *   and rejected claims live only here; everyone else sees a platform's tag on
 *   the public profile once it is approved. `withCreatorClaims` returns a new
 *   user rather than mutating.
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

  /** The user's claims, one per platform; empty when there are none. */
  get creatorClaims(): CreatorClaims {
    return this.props.creatorClaims ?? NO_CLAIMS;
  }

  /** Whether this user holds exactly `claims` — the same claim on every platform. */
  holdsCreatorClaims(claims: CreatorClaims): boolean {
    return this.creatorClaims.equals(claims);
  }

  /** The same user holding `claims` instead. */
  withCreatorClaims(claims: CreatorClaims): UserEntity {
    return new UserEntity({ ...this.props, creatorClaims: claims });
  }
}
