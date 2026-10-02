import { useCallback } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { CreatorTagOutcome } from '@domain/instagram/connect/creator-tag-outcome';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast, showSuccessToast, showWarningToast } from '@presentation/base/feedback/show-toast';
import { t } from '@presentation/i18n';

/**
 * Finishes an Instagram login with the return link's one-time code and says
 * how it went (spec → toasts): connected (or reconnected) with the creator
 * tag approved, connected but the handle belongs to another Recipely
 * account, or not linked with the failure's own copy — `link_invalid` (the
 * code is spent or older than ten minutes) and `instagram_account_linked`
 * (the account is linked to someone else) included.
 *
 * @remarks
 * - **The creator claims are re-read** after a link, so Edit Profile and the
 *   creator badge show the Instagram tag approved without a restart.
 */
export const useInstagramFinalize = (): ((code: string) => Promise<boolean>) => {
  const { instagramStore, authStore } = useStores();
  return useCallback(
    async (code: string): Promise<boolean> => {
      const before = instagramStore.getState().connection;
      const wasExpired = before.status === StoreStatus.Loaded && before.connection.isExpired;
      const result = await instagramStore.getState().finalize(code);
      if (!result.ok) {
        showErrorToast(result.failure);
        return false;
      }
      void authStore.getState().refreshCreatorClaim();
      const copy = t().instagram;
      switch (result.value.creatorTag) {
        case CreatorTagOutcome.Approved:
          showSuccessToast(wasExpired ? copy.reconnectedToast : copy.connectedToast);
          break;
        case CreatorTagOutcome.Taken:
          showWarningToast(copy.tagTakenToast.replace('{h}', result.value.connection.displayHandle));
          break;
        case CreatorTagOutcome.Invalid:
          showWarningToast(copy.tagInvalidToast);
          break;
      }
      return true;
    },
    [authStore, instagramStore],
  );
};
