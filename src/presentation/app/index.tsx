import { Platform } from 'react-native';
import { Redirect } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { onboardingStore } from '@application/onboarding/onboarding-store';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Launch redirect. Guest-first: the app never opens on a login wall (Apple App
 * Store guideline 5.1.1(v)). Authenticated and errored sessions — and every
 * session on web — land on the browsable recipe list (`/recipes`); account-bound
 * actions still gate to login on tap via {@link useGuestGate}.
 *
 * The one exception is the native onboarding gate: an unauthenticated guest on
 * iOS/Android is sent to the welcome carousel on every cold launch until they
 * either sign in or tap "don't show this again". That screen is not a login wall
 * — it offers "explore without signing in" — so the guideline still holds. Web
 * never auto-gates; it exposes a Discover entry in the recipes header instead.
 * Renders nothing while the session (or the persisted dismissal) is still
 * resolving so a valid session is never bounced.
 */
export const IndexRedirect = (): React.JSX.Element | null => {
  const { authStore } = useStores();
  const authState = authStore((s) => s.state);
  const onboardingHydrated = onboardingStore((s) => s.hydrated);
  const onboardingDismissed = onboardingStore((s) => s.dismissed);

  if (authState.status === 'idle' || authState.status === 'loading') {
    return null;
  }

  const isNativeGuest =
    Platform.OS !== 'web' && authState.status === 'unauthenticated';

  if (isNativeGuest) {
    if (!onboardingHydrated) return null;
    if (!onboardingDismissed) return <Redirect href={RoutePaths.onboarding} />;
  }

  return <Redirect href={RoutePaths.recipes} />;
};

export default IndexRedirect;
