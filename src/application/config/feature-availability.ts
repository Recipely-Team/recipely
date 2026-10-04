/** Where a flagged feature is switched on — see `FeatureFlags`. */
export const FeatureAvailability = {
  On: 'on',
  Off: 'off',
  DevOnly: 'dev-only',
} as const;

export type FeatureAvailabilityType = (typeof FeatureAvailability)[keyof typeof FeatureAvailability];
