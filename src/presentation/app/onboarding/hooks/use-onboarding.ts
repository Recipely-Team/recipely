import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { onboardingStore } from '@application/onboarding/onboarding-store';
import { RoutePaths } from '@presentation/base/constants';
import { enterApp } from '@presentation/navigation/enter-app';
import type { UseOnboardingResult } from '@presentation/app/onboarding/model/use-onboarding-result';

/**
 * Wires the onboarding entry actions to navigation and the persisted dismissal.
 * "Explore" and "don't show again" both land on the browsable recipe list and
 * both record the dismissal: a guest who chose to browse has answered the
 * welcome screen, and showing it on every cold launch after that was noise.
 * Signing in stays one tap away in the feed's header.
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
    void onboardingStore.getState().dismiss();
    enterApp(router, RoutePaths.recipes);
  }, [router]);

  const onDismiss = useCallback((): void => {
    void onboardingStore.getState().dismiss();
    enterApp(router, RoutePaths.recipes);
  }, [router]);

  return { onSignUp, onSignIn, onExplore, onDismiss };
};
