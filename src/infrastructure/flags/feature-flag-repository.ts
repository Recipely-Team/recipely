import { ok, fail } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { isObject } from '@core/guards/type-guards';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { FeatureFlagRepositoryInterface } from '@domain/flags/feature-flag-repository-interface';
import type { FeatureFlagsResponseDto } from '@infrastructure/flags/feature-flags-dto';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';

/**
 * Implements `FeatureFlagRepositoryInterface` against `GET /flags`.
 *
 * @remarks
 * - **Non-boolean values are dropped**, so a malformed row can only leave a
 *   flag on its build-time value, never switch it.
 */
export class FeatureFlagRepository implements FeatureFlagRepositoryInterface {
  constructor(private readonly http: HttpClient) {}

  async fetchOverrides(): Promise<Result<Readonly<Record<string, boolean>>, Failure>> {
    const result = await this.http.get<FeatureFlagsResponseDto>(ApiRoutes.flags);
    if (!result.ok) return fail(result.failure);
    const flags = result.value.flags;
    if (!isObject(flags)) return ok({});
    const overrides: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(flags)) {
      if (typeof value === 'boolean') overrides[key] = value;
    }
    return ok(overrides);
  }
}
