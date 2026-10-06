/** Wire format of `GET /flags`: the admin's on/off overrides, keyed by flag name. */
export interface FeatureFlagsResponseDto {
  flags?: unknown;
}
