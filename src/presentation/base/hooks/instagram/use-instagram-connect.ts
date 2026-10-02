import { useCallback, useRef, useState } from 'react';
import { readInstagramReturn } from '@domain/instagram/connect/read-instagram-return';
import { readReturnQuery } from '@domain/instagram/connect/read-return-query';
import { InstagramReturnKind } from '@domain/instagram/connect/instagram-return-kind';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast, showWarningToast } from '@presentation/base/feedback/show-toast';
import { useInstagramFinalize } from '@presentation/base/hooks/instagram/use-instagram-finalize';
import { openInstagramLogin } from '@presentation/base/utils/instagram/open-instagram-login';
import { instagramReturnUrl } from '@presentation/base/utils/instagram/instagram-return-url';
import { InstagramLoginInFlight } from '@presentation/base/utils/instagram/instagram-login-in-flight';
import { InstagramConnectPhase, type InstagramConnectPhaseType } from '@presentation/base/widgets/instagram/instagram-connect-phase';
import { t } from '@presentation/i18n';

/** What the Connect button needs. */
interface InstagramConnect {
  phase: InstagramConnectPhaseType;
  connect: () => void;
}

/**
 * Connect with Instagram (backend #374 → App flow): ask the server for the
 * login URL with this app's return link, open it, read the link it comes back
 * with, and finish the link with its code.
 *
 * @remarks
 * - **Closing the login is not an error**: the button shows "cancelled —
 *   nothing was linked" above it; saying no on Instagram's page reads the
 *   same. A login Instagram or the server could not complete is a toast.
 * - **Web leaves the tab** for instagram.com; `/instagram-connected` finishes
 *   when it comes back, so this hook never sees the return there.
 * - **One login at a time**, guarded by a ref — `phase` is render state and a
 *   second tap in the same frame still sees Idle.
 */
export const useInstagramConnect = (): InstagramConnect => {
  const { instagramStore } = useStores();
  const finalize = useInstagramFinalize();
  const [phase, setPhase] = useState<InstagramConnectPhaseType>(InstagramConnectPhase.Idle);
  const busy = useRef(false);

  const connect = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setPhase(InstagramConnectPhase.Waiting);
    const run = async (): Promise<InstagramConnectPhaseType> => {
      const returnUrl = instagramReturnUrl();
      const start = await instagramStore.getState().startLogin(returnUrl);
      if (!start.ok) {
        showErrorToast(start.failure);
        return InstagramConnectPhase.Idle;
      }
      InstagramLoginInFlight.begin();
      const back = await openInstagramLogin(start.value, returnUrl).finally(InstagramLoginInFlight.end);
      if (back === null) return InstagramConnectPhase.Cancelled;
      const outcome = readInstagramReturn(readReturnQuery(back));
      switch (outcome.kind) {
        case InstagramReturnKind.Authorized:
          await finalize(outcome.code);
          return InstagramConnectPhase.Idle;
        case InstagramReturnKind.Failed:
          showWarningToast(t().instagram.loginFailed);
          return InstagramConnectPhase.Idle;
        case InstagramReturnKind.Denied:
        case InstagramReturnKind.Cancelled:
          return InstagramConnectPhase.Cancelled;
      }
    };
    void run().then((next) => {
      busy.current = false;
      setPhase(next);
    });
  }, [finalize, instagramStore]);

  return { phase, connect };
};
