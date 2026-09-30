import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';

/** Clears the signed-in user's creator claim and returns the session without it. */
export class RemoveCreatorTagUseCase {
  constructor(private readonly repo: AuthRepositoryInterface) {}

  execute(): Promise<Result<AuthSessionEntity, Failure>> {
    return this.repo.removeCreatorTag();
  }
}
