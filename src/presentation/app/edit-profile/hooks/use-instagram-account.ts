import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useInstagramConnection } from '@presentation/base/hooks/instagram/use-instagram-connection';
import { useInstagramConnect } from '@presentation/base/hooks/instagram/use-instagram-connect';
import { showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import { RoutePaths } from '@presentation/base/constants';
import type { UseInstagramAccountResult } from '@presentation/app/edit-profile/model/use-instagram-account-result';
import { t } from '@presentation/i18n';

/**
 * The creator card's Instagram row (Instagram automations spec §1): the
 * link as the server holds it, Connect / Reconnect, and Disconnect behind a
 * confirmation.
 *
 * @remarks
 * - **Disconnecting re-reads the creator claims**: the Instagram tag goes
 *   unless another platform is approved, and the card must say so at once.
 */
export const useInstagramAccount = (): UseInstagramAccountResult => {
  const router = useRouter();
  const { instagramStore, authStore } = useStores();
  const connection = useInstagramConnection();
  const { phase, connect } = useInstagramConnect();
  const [isDisconnectOpen, setDisconnectOpen] = useState(false);
  const [isDisconnecting, setDisconnecting] = useState(false);
  const busy = useRef(false);

  return {
    connection,
    phase,
    connect,
    isDisconnectOpen,
    isDisconnecting,
    openDisconnect: () => setDisconnectOpen(true),
    closeDisconnect: () => setDisconnectOpen(false),
    confirmDisconnect: () => {
      if (busy.current) return;
      busy.current = true;
      setDisconnecting(true);
      void instagramStore
        .getState()
        .disconnect()
        .then((result) => {
          busy.current = false;
          setDisconnecting(false);
          setDisconnectOpen(false);
          if (!result.ok) return void showErrorToast(result.failure);
          void authStore.getState().refreshCreatorClaim();
          showSuccessToast(t().instagram.disconnectedToast);
        });
    },
    openAutomations: () => router.push(RoutePaths.automations),
  };
};
