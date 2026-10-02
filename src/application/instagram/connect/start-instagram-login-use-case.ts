import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/** The instagram.com login URL for this user; Instagram returns to `returnTo` (the app's own link). */
export class StartInstagramLoginUseCase {
  constructor(private readonly repo: InstagramRepositoryInterface) {}

  execute(returnTo: string): Promise<Result<string, Failure>> {
    return this.repo.startLogin(returnTo);
  }
}
