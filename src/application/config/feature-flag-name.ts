import type { FeatureFlags } from '@application/config/feature-flags';

/**
 * The names of the app's feature flags — the keys of `FeatureFlags`, and the
 * keys the admin panel's Feature Flag table overrides by.
 */
export const FeatureFlagName = {
  InstagramAutomations: 'instagramAutomations',
} as const satisfies Record<string, keyof typeof FeatureFlags>;
