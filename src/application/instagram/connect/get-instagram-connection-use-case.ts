import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import { InstagramConnection } from '@domain/instagram/connect/instagram-connection';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/**
 * Reads the viewer's Instagram link, and whether the feature is available at all.
 *
 * @remarks
 * - **Flagged off, the server is never asked** (rule 23g): the answer is
 *   `InstagramConnection.none()`, which hides every entry point.
 */
export class GetInstagramConnectionUseCase {
  constructor(
    private readonly repo: InstagramRepositoryInterface,
    /** The `instagramAutomations` flag (admin override, else build value). */
    private readonly isEnabled: () => Promise<boolean>,
  ) {}

  async execute(): Promise<Result<InstagramConnection, Failure>> {
    if (!(await this.isEnabled())) return ok(InstagramConnection.none());
    return this.repo.getConnection();
  }
}
