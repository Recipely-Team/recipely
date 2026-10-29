import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AxiosHttpClient } from '@infrastructure/network/http/axios-http-client';
import type { AppVersionRepositoryInterface } from '@domain/app-version/app-version-repository-interface';
import { VersionCheckStatus } from '@domain/app-version/version-check-status';
import type { VersionVerdict } from '@domain/app-version/version-verdict';
import type { AppVersionResponseDto } from '@infrastructure/app-version/app-version-response-dto';
import { toVersionVerdict } from '@infrastructure/app-version/to-version-verdict';
import { toAppVersionQuery } from '@infrastructure/app-version/to-app-version-query';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';

const CURRENT: VersionVerdict = {
  status: VersionCheckStatus.UpToDate,
  reason: null,
  latestVersion: null,
  minimumVersion: null,
  storeUrl: null,
};

/**
 * Implements `AppVersionRepositoryInterface` against `GET /app/version`.
 *
 * @remarks
 * - **`build` is `null` on the web** (and on a build without a version), which
 *   is always current: it answers `upToDate` and sends nothing.
 */
export class AppVersionRepository implements AppVersionRepositoryInterface {
  constructor(
    private readonly http: AxiosHttpClient,
    private readonly build: { platform: string; version: string } | null,
  ) {}

  async check(): Promise<Result<VersionVerdict, Failure>> {
    if (this.build === null) return ok(CURRENT);
    const result = await this.http.get<AppVersionResponseDto>(ApiRoutes.appVersion, {
      params: toAppVersionQuery(this.build),
    });
    if (!result.ok) return fail(result.failure);
    return toVersionVerdict(result.value);
  }
}
