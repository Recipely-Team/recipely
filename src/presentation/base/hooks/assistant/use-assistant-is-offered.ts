import { usePathname } from 'expo-router';
import { RoutePaths } from '@presentation/base/constants';

/**
 * The routes where the assistant has nothing to offer, so it is not there.
 *
 * Signing in, registering, recovering a password and onboarding are all
 * screens where every action is one the user must take themselves — the
 * assistant cannot type a password and must not appear to try. It showed up on
 * the login screen, which is both useless and alarming.
 */
const CLOSED_TO_ASSISTANT: readonly string[] = [
  RoutePaths.onboarding,
  RoutePaths.login,
  RoutePaths.register,
  RoutePaths.forgotPassword,
  RoutePaths.verifyCode,
];

/**
 * Whether the assistant belongs on the screen the user is looking at.
 *
 * @remarks
 * Asked by path rather than by auth state: a signed-out user browsing recipes
 * still benefits from it, and a signed-in user who opens the password screen
 * still should not see it.
 */
export const useAssistantIsOffered = (): boolean => {
  const pathname = usePathname();
  return !CLOSED_TO_ASSISTANT.some((route) => pathname.startsWith(route));
};
