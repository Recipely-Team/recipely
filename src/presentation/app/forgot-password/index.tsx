import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { AuthHeroLayout } from '@presentation/base/widgets/layout/auth-hero-layout';
import { ForgotPasswordInputView } from '@presentation/app/forgot-password/body/forgot-password-input-view';
import { ForgotPasswordSuccessView } from '@presentation/app/forgot-password/body/forgot-password-success-view';
import { t } from '@presentation/i18n';
import { CharConstants } from '@core/constants';
import { isBlank } from '@core/guards/type-guards';

export const ForgotPasswordScreen = (): React.JSX.Element => {
  const router = useRouter();
  const { authStore } = useStores();
  const requestPasswordReset = authStore((s) => s.requestPasswordReset);

  const [email, setEmail] = useState(CharConstants.empty);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | undefined>(undefined);

  const handleSend = async (): Promise<void> => {
    if (isBlank(email)) return;
    setSendError(undefined);
    setLoading(true);
    const failure = await requestPasswordReset(email);
    setLoading(false);
    if (failure === null) {
      setSent(true);
    } else {
      setSendError(t().forgotPassword.sendError);
    }
  };

  return (
    <AuthHeroLayout
      icon="key-outline"
      title={t().forgotPassword.title}
      subtitle={t().forgotPassword.subtitle}
      backLabel={t().forgotPassword.backToLogin}
      onBack={() => router.back()}
    >
      {sent ? (
        <ForgotPasswordSuccessView
          email={email}
          onBack={() => router.back()}
          onTryDifferent={() => setSent(false)}
        />
      ) : (
        <ForgotPasswordInputView
          email={email}
          onChangeEmail={setEmail}
          focused={focused}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          loading={loading}
          onSend={() => { void handleSend(); }}
          onBack={() => router.back()}
          error={sendError}
        />
      )}
    </AuthHeroLayout>
  );
};

export default ForgotPasswordScreen;
