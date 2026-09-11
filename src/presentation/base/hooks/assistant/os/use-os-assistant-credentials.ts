import { useEffect } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { useLocale } from '@presentation/i18n/use-locale';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * Keeps the token the OS assistant answers with, and takes it away on sign-out.
 *
 * @remarks
 * - **Minted once per launch, deliberately, rather than cached against its
 *   expiry.** The token lasts thirty days and the native side has no refresh
 *   flow, so the app could track `expiresAt` and skip the request most
 *   mornings — at the cost of storage, a staleness rule, and a clock to be
 *   wrong about. One small POST beside the session restore the app already
 *   makes buys the invariant that the stored token is always one this launch
 *   verified.
 * - **A sign-out withdraws it, and that half matters more than the minting.**
 *   The credential outlives the session in the shared container: left behind,
 *   the next person to hold the phone can ask Siri a question that is answered
 *   with the previous user's account.
 * - **A failed mint leaves the old token alone.** Offline at launch is the
 *   common case, and replacing a working credential with nothing would turn a
 *   temporary network problem into a feature that stays broken until the next
 *   successful launch.
 * - **Nothing reads this yet.** `askRecipely` opens the app today; the token is
 *   what lets the native side answer without one, and it has to be in the
 *   container before that code can be written.
 */
export const useOsAssistantCredentials = (): void => {
  const { osAssistant, authStore, assistantTokens } = useStores();
  const locale = useLocale();
  const isSignedIn = authStore((state) => state.state.status === StoreStatus.Authenticated);

  useEffect(() => {
    if (!osAssistant.isAvailable) return;

    if (!isSignedIn) {
      void osAssistant.publishCredentials(null, locale);
      return;
    }

    let isCurrent = true;
    void (async () => {
      const minted = await assistantTokens.mintIntentToken();
      if (!isCurrent || !minted.ok) return;
      await osAssistant.publishCredentials(minted.value.token, locale);
    })();

    return () => {
      isCurrent = false;
    };
  }, [osAssistant, authStore, assistantTokens, isSignedIn, locale]);
};
