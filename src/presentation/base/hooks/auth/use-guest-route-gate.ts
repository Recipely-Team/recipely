import { useCallback, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import type { SignInPromptSheetProps } from '@presentation/base/widgets/sheets/sign-in-prompt-sheet';
import { RoutePaths } from '@presentation/base/constants';
import { t } from '@presentation/i18n';

interface GuestRouteGate {
  /**
   * Runs `navigate(path)` — unless a guest is asking for an account page, in
   * which case the sign-in sheet opens with what that page holds.
   */
  open: (path: string, navigate: (path: string) => void) => void;
  /** Spread onto a `SignInPromptSheet`. */
  prompt: SignInPromptSheetProps;
}

/** Why a guest would sign in for each account page a tab, the bell or the web header opens. */
const guestReasonFor = (path: string): string | undefined => {
  switch (path) {
    case RoutePaths.myRecipes:
      return t().signInPrompt.myRecipes;
    case RoutePaths.diary:
      return t().signInPrompt.diary;
    case RoutePaths.profile:
      return t().signInPrompt.profile;
    case RoutePaths.notifications:
      return t().signInPrompt.notifications;
    case RoutePaths.shoppingList:
      return t().signInPrompt.shoppingList;
    default:
      return undefined;
  }
};

/**
 * Explains an account page to a guest instead of bouncing them to a bare login form.
 *
 * @remarks
 * - **Why.** A guest tapping My Recipes, Diary, Profile or the bell was sent by
 *   the auth guard to `/login` with no word of why: the tab bar vanished and the
 *   only way back was a small "Continue as guest" link. Now the guest stays where
 *   they are, the tab bar stays, and a sheet says what the page holds with a
 *   Sign in button that returns them to it afterwards.
 * - **Guest-first launch is unchanged.** Browsing stays open to everyone (App
 *   Review 5.1.1(v)); only the four account pages ask. The auth guard remains
 *   the safety net for deep links into them.
 * - **Only a settled guest is asked.** While the session is still hydrating the
 *   press navigates as before, so a signed-in user is never shown the sheet.
 */
export const useGuestRouteGate = (): GuestRouteGate => {
  const router = useRouter();
  const { authStore } = useStores();
  const isGuest = authStore((s) => s.state.status === StoreStatus.Unauthenticated);
  const [pending, setPending] = useState<string | null>(null);

  const open = useCallback(
    (path: string, navigate: (path: string) => void): void => {
      if (isGuest && guestReasonFor(path) !== undefined) {
        setPending(path);
        return;
      }
      navigate(path);
    },
    [isGuest],
  );

  const onClose = useCallback((): void => setPending(null), []);
  const onSignIn = useCallback((): void => {
    if (pending === null) return;
    setPending(null);
    // Cast: a runtime path is not in the typed-routes union.
    router.push(RoutePaths.loginWithRedirect(pending) as Href);
  }, [pending, router]);

  return {
    open,
    prompt: {
      visible: pending !== null,
      message: pending !== null ? guestReasonFor(pending) : undefined,
      onClose,
      onSignIn,
    },
  };
};
