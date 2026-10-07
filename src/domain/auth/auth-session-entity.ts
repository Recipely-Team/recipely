import { BaseEntity } from '@core/entity/base-entity';
import type { AuthSessionEntityProps } from '@domain/auth/auth-session-entity-props';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { UserEntity } from '@domain/auth/user-entity';
import { isBlank } from '@core/guards/type-guards';


/**
 * Domain entity that represents an authenticated user session, bundling the
 * access token, its expiry, and the associated `UserEntity`. Validates that `id`,
 * `accessToken`, and `expiresAt` are well-formed before construction.
 */
export class AuthSessionEntity extends BaseEntity<AuthSessionEntityProps> {
  private constructor(props: AuthSessionEntityProps) {
    super(props);
  }

  static create(props: AuthSessionEntityProps): Result<AuthSessionEntity, ValidationFailure> {
    if (isBlank(props.id)) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.session.idRequired, 'id'));
    }
    if (isBlank(props.accessToken)) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.session.accessTokenRequired, 'accessToken'));
    }
    if (Number.isNaN(props.expiresAt.getTime())) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.session.expiresAtInvalid, 'expiresAt'));
    }
    return ok(new AuthSessionEntity(props));
  }

  get accessToken(): string {
    return this.props.accessToken;
  }

  get refreshToken(): string | undefined {
    return this.props.refreshToken;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get user(): UserEntity {
    return this.props.user;
  }

  /**
   * Returns `true` when `now` is at or past `expiresAt`, indicating the token
   * should be refreshed or the user prompted to sign in again.
   */
  isExpired(now: Date = new Date()): boolean {
    return now.getTime() >= this.props.expiresAt.getTime();
  }
}
