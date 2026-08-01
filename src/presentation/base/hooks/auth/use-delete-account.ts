import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Drives the "delete my account" confirmation: its sheet, its in-flight flag,
 * and the inline error it shows when the server refuses.
 *
 * @remarks
 * - **Two screens offer this**, Settings and the Profile tab, and both carried
 *   a byte-identical copy of the state and the handler. Two copies of a
 *   destructive flow is two places for one of them to drift.
 * - **A failure leaves the session intact**, so the sheet stays open and the
 *   message goes inline. Navigating away would look like the deletion worked.
 * - **Success replaces rather than pushes** — the account is gone, so there is
 *   nothing behind this screen to go back to.
 */
export const useDeleteAccount = () => {
  const router = useRouter();
  const { authStore } = useStores();
  const deleteAccount = authStore((s) => s.deleteAccount);

  const [visible, setVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const open = useCallback(() => {
    setError(undefined);
    setVisible(true);
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const confirm = useCallback(async (): Promise<void> => {
    setError(undefined);
    setDeleting(true);
    const failure = await deleteAccount();
    setDeleting(false);
    if (failure === null) {
      setVisible(false);
      router.replace(RoutePaths.login);
      return;
    }
    setError(failureToastMessage(failure));
  }, [deleteAccount, router]);

  return { visible, deleting, error, open, close, confirm };
};
