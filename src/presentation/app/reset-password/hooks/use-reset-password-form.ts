import { useCallback, useState } from 'react';
import { Password } from '@domain/auth/password';
import { useStores } from '@presentation/bootstrap/use-stores';
import { authFormMessage } from '@presentation/base/errors/auth-form-message';
import { t } from '@presentation/i18n';
import { CharConstants } from '@core/constants';
import { FailureCode } from '@core/failure';

/**
 * The reset-password form: the two fields, the rules they must pass, and the
 * submit against the emailed token.
 *
 * @remarks
 * - **Rules come from the domain** — `Password.create` decides "too short", the
 *   same check register uses.
 * - **An expired or unknown token** (`not_found` / `validation` from the
 *   backend) reads as one message: the link no longer works.
 */
export function useResetPasswordForm(token: string) {
  const { authStore } = useStores();
  const resetPassword = authStore((s) => s.resetPassword);
  const [newPassword, setNewPassword] = useState(CharConstants.empty);
  const [confirmPassword, setConfirmPassword] = useState(CharConstants.empty);
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const submit = useCallback(async (): Promise<void> => {
    if (!Password.create(newPassword).ok) {
      setError(t().resetPassword.tooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t().resetPassword.mismatch);
      return;
    }
    setError(undefined);
    setLoading(true);
    const failure = await resetPassword(token, newPassword);
    setLoading(false);
    if (failure === null) {
      setSucceeded(true);
      return;
    }
    setError(
      authFormMessage(failure, {
        [FailureCode.NotFound]: t().resetPassword.invalidOrExpired,
        [FailureCode.Validation]: t().resetPassword.invalidOrExpired,
      }),
    );
  }, [newPassword, confirmPassword, resetPassword, token]);

  return { newPassword, setNewPassword, confirmPassword, setConfirmPassword, loading, succeeded, error, setError, submit };
}
