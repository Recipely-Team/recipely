import { usePathname } from 'expo-router';
import { RoutePaths } from '@presentation/base/constants';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';

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
  RoutePaths.resetPassword,
];

/**
 * Whether the assistant belongs on the screen the user is looking at.
 *
 * @remarks
 * - **Signed in, always.** Nearly everything it does is the user's own — their
 *   drafts, their saved recipes, their profile, their settings — and an
 *   assistant offered to someone with no account can only fail at most of it,
 *   after spending a session's minutes finding out.
 * - **And not on the screens where signing in happens**, even when a session
 *   already exists: those are screens where every action is one the user must
 *   take themselves, and it cannot type a password.
 */
export const useAssistantIsOffered = (): boolean => {
  const { authStore } = useStores();
  const authState = authStore((s) => s.state);
  const pathname = usePathname();

  if (authState.status !== StoreStatus.Authenticated) return false;
  return !CLOSED_TO_ASSISTANT.some((route) => pathname.startsWith(route));
};
