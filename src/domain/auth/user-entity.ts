import { BaseEntity } from '@core/entity/base-entity';
import type { UserEntityProps } from '@domain/auth/user-entity-props';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { Email } from '@domain/common/email';
import { ValueConstants } from '@core/constants';
import type { CreatorClaim } from '@domain/creators/creator-claim';
import { CreatorStatus } from '@domain/creators/creator-status';


/**
 * Domain entity representing an authenticated application user. Validates that
 * `id` and `displayName` are non-empty before construction.
 *
 * @remarks
 * - **The creator claim is the user's own view.** Pending and rejected claims
 *   live only here; everyone else sees a tag on the public profile once it is
 *   approved. `withCreatorClaim` returns a new user rather than mutating.
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

  get creatorClaim(): CreatorClaim | null {
    return this.props.creatorClaim ?? null;
  }

  /** `none` when the user has not claimed an account. */
  get creatorStatus(): CreatorStatus {
    return this.props.creatorClaim?.status ?? CreatorStatus.None;
  }

  /** Whether this user holds exactly `claim` — same tag and status, or both without one. */
  holdsCreatorClaim(claim: CreatorClaim | null): boolean {
    const own = this.creatorClaim;
    return own === null || claim === null ? own === claim : own.equals(claim);
  }

  /** The same user holding `claim` instead (`null` clears it). */
  withCreatorClaim(claim: CreatorClaim | null): UserEntity {
    return new UserEntity({ ...this.props, creatorClaim: claim });
  }
}
