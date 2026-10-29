/** Wire format of `GET /app/version`; every field is checked before it is trusted. */
export interface AppVersionResponseDto {
  status?: unknown;
  reason?: unknown;
  latestVersion?: unknown;
  minimumVersion?: unknown;
  storeUrl?: unknown;
}
