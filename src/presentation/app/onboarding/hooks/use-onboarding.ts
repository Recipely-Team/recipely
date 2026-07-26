import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { onboardingStore } from '@application/onboarding/onboarding-store';
import { RoutePaths } from '@presentation/base/constants';
import type { UseOnboardingResult } from '@presentation/app/onboarding/model/use-onboarding-result';

/**
 * Wires the onboarding entry actions to navigation and the persisted dismissal.
 * "Explore" and "don't show again" both land on the browsable recipe list; the
 * latter additionally records the choice so the native launch gate never shows
 * the welcome screen again.
 */
export const useOnboarding = (): UseOnboardingResult => {
  const router = useRouter();

  const onSignUp = useCallback((): void => {
    router.push(RoutePaths.register);
  }, [router]);

  const onSignIn = useCallback((): void => {
    router.push(RoutePaths.login);
  }, [router]);

  const onExplore = useCallback((): void => {
    router.replace(RoutePaths.recipes);
  }, [router]);

  const onDismiss = useCallback((): void => {
    void onboardingStore.getState().dismiss();
    router.replace(RoutePaths.recipes);
  }, [router]);

  return { onSignUp, onSignIn, onExplore, onDismiss };
};
