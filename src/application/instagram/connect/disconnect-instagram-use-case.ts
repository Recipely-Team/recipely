import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/** Unlinks the account; rules and history are kept, and stop. */
export class DisconnectInstagramUseCase {
  constructor(private readonly repo: InstagramRepositoryInterface) {}

  execute(): Promise<Result<void, Failure>> {
    return this.repo.disconnect();
  }
}
