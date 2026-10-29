import { fail, ok } from '@core/result/result-helpers';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Mapper } from '@core/mapper/mapper';
import { isString } from '@core/guards/type-guards';
import { UrlConstants } from '@core/constants';
import { VersionCheckStatus, type VersionCheckStatusType } from '@domain/app-version/version-check-status';
import { UpdateRequiredReason, type UpdateRequiredReasonType } from '@domain/app-version/update-required-reason';
import type { VersionVerdict } from '@domain/app-version/version-verdict';
import type { AppVersionResponseDto } from '@infrastructure/app-version/app-version-response-dto';

const STATUSES: readonly unknown[] = Object.values(VersionCheckStatus);
const REASONS: readonly unknown[] = Object.values(UpdateRequiredReason);

const stringOrNull = (value: unknown): string | null => (isString(value) ? value : null);

/**
 * Maps `GET /app/version` onto a `VersionVerdict`.
 *
 * @remarks
 * - **An unknown status is a failure, not a guess**, so a newer backend word
 *   leaves the app running (the store fails open) instead of blocking it.
 * - **Only an `https://` store link is kept.** The app opens it with the OS, so
 *   anything else (`javascript:`, `intent:`, a custom scheme) is dropped for the
 *   build's own store link.
 */
export const toVersionVerdict: Mapper<AppVersionResponseDto, VersionVerdict, ValidationFailure> = (dto) => {
  if (!STATUSES.includes(dto.status)) return fail(new ValidationFailure(DiagnosticMessage.appVersion.unknownStatus));
  const storeUrl = stringOrNull(dto.storeUrl);
  return ok({
    status: dto.status as VersionCheckStatusType,
    reason: REASONS.includes(dto.reason) ? (dto.reason as UpdateRequiredReasonType) : null,
    latestVersion: stringOrNull(dto.latestVersion),
    minimumVersion: stringOrNull(dto.minimumVersion),
    storeUrl: storeUrl?.startsWith(UrlConstants.httpsScheme) === true ? storeUrl : null,
  });
};
