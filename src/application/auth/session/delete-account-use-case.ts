import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AccountRepositoryInterface } from '@domain/auth/account-repository-interface';

/**
 * Permanently deletes the signed-in user's account and all of its data on the
 * server, clearing the local session on success.
 */
export class DeleteAccountUseCase {
  constructor(private readonly repo: AccountRepositoryInterface) {}

  execute(): Promise<Result<void, Failure>> {
    return this.repo.deleteAccount();
  }
}
