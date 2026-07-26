import { BaseEntity } from '@core/entity/base-entity';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { UserEntity } from '@domain/auth/user-entity';
import { ValueConstants } from '@core/constants';

export interface AuthSessionProps {
  id: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  user: UserEntity;
}

/**
 * Domain entity that represents an authenticated user session, bundling the
 * access token, its expiry, and the associated `UserEntity`. Validates that `id`,
 * `accessToken`, and `expiresAt` are well-formed before construction.
 */
export class AuthSessionEntity extends BaseEntity<AuthSessionProps> {
  private constructor(props: AuthSessionProps) {
    super(props);
  }

  static create(props: AuthSessionProps): Result<AuthSessionEntity, ValidationFailure> {
    if (props.id.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure('Session id must be non-empty', 'id'));
    }
    if (props.accessToken.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure('accessToken must be non-empty', 'accessToken'));
    }
    if (Number.isNaN(props.expiresAt.getTime())) {
      return fail(new ValidationFailure('expiresAt must be a valid Date', 'expiresAt'));
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
