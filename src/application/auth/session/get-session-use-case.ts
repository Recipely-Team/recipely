import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';

/**
 * Restores the persisted session on cold start.
 *
 * @remarks
 * - **Only a live session comes back** — `null` when none is stored or the stored
 *   one has expired, so the caller never signs a user in on a dead token.
 */
export class GetSessionUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  async execute(): Promise<Result<AuthSessionEntity | null, Failure>> {
    const result = await this.repo.getCurrentSession();
    if (!result.ok || result.value === null) return result;
    return result.value.isExpired() ? ok(null) : result;
  }
}
