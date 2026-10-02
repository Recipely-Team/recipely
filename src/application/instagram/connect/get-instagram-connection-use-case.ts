import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { InstagramConnection } from '@domain/instagram/connect/instagram-connection';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/** Reads the viewer's Instagram link, and whether the feature is available at all. */
export class GetInstagramConnectionUseCase {
  constructor(private readonly repo: InstagramRepositoryInterface) {}

  execute(): Promise<Result<InstagramConnection, Failure>> {
    return this.repo.getConnection();
  }
}
