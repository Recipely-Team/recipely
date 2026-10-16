import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { onboardingStore } from '@application/onboarding/onboarding-store';
import { RoutePaths } from '@presentation/base/constants';
import { enterApp } from '@presentation/navigation/enter-app';
import type { UseOnboardingResult } from '@presentation/app/onboarding/model/use-onboarding-result';

/**
 * The welcome gate's three exits. Skip replaces the old "Explore without
 * signing in" and "Don't show this page again" links: both entered the app as
 * a guest and marked onboarding seen, so one action does it (Onboarding 2026).
 */
export const useOnboarding = (): UseOnboardingResult => {
  const router = useRouter();

  const onSignUp = useCallback((): void => {
    router.push(RoutePaths.register);
  }, [router]);

  const onSignIn = useCallback((): void => {
    router.push(RoutePaths.login);
  }, [router]);

  const onSkip = useCallback((): void => {
    void onboardingStore.getState().dismiss();
    enterApp(router, RoutePaths.recipes);
  }, [router]);

  return { onSignUp, onSignIn, onSkip };
};
