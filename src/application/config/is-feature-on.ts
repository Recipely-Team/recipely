import { FeatureAvailability, type FeatureAvailabilityType } from '@application/config/feature-availability';

/** Resolves a flag for this build: `DevOnly` is on only in the development variant. */
export const isFeatureOn = (availability: FeatureAvailabilityType, isDevBuild: boolean): boolean =>
  availability === FeatureAvailability.On || (availability === FeatureAvailability.DevOnly && isDevBuild);
