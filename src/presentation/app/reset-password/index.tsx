import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { isString } from '@core/guards/type-guards';
import { CharConstants, ValueConstants } from '@core/constants';
import { AuthField } from '@presentation/app/login/model/auth-field';
import { AuthHeroLayout } from '@presentation/base/widgets/layout/auth-hero-layout';
import { ResetPasswordFormView } from '@presentation/app/reset-password/body/reset-password-form-view';
import { ResetPasswordSuccessView } from '@presentation/app/reset-password/body/reset-password-success-view';
import { ResetPasswordInvalidLinkView } from '@presentation/app/reset-password/body/reset-password-invalid-link-view';
import { useResetPasswordForm } from '@presentation/app/reset-password/hooks/use-reset-password-form';
import { RoutePaths } from '@presentation/base/constants';
import { t } from '@presentation/i18n';

export const ResetPasswordScreen = (): React.JSX.Element => {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const tokenValue = isString(token) ? token.trim() : CharConstants.empty;

  const form = useResetPasswordForm(tokenValue);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusField, setFocusField] = useState<AuthField | null>(null);
  const confirmRef = useRef<TextInput>(null);
  const backToLogin = (): void => router.replace(RoutePaths.login);

  let cardBody: React.JSX.Element;
  if (tokenValue.length === ValueConstants.zero) {
    cardBody = <ResetPasswordInvalidLinkView onBack={backToLogin} />;
  } else if (form.succeeded) {
    cardBody = <ResetPasswordSuccessView onBack={backToLogin} />;
  } else {
    cardBody = (
      <ResetPasswordFormView
        newPassword={form.newPassword}
        onChangeNew={form.setNewPassword}
        confirmPassword={form.confirmPassword}
        onChangeConfirm={form.setConfirmPassword}
        showNew={showNew}
        onToggleNew={() => setShowNew((v) => !v)}
        showConfirm={showConfirm}
        onToggleConfirm={() => setShowConfirm((v) => !v)}
        focusField={focusField}
        onFocus={setFocusField}
        onBlur={() => setFocusField(null)}
        confirmRef={confirmRef}
        loading={form.loading}
        error={form.error}
        onSubmit={() => { void form.submit(); }}
        onBack={backToLogin}
      />
    );
  }

  return (
    <AuthHeroLayout
      icon="lock-closed-outline"
      title={t().resetPassword.title}
      subtitle={t().resetPassword.subtitle}
      backLabel={t().resetPassword.backToLogin}
      onBack={backToLogin}
    >
      {cardBody}
    </AuthHeroLayout>
  );
};

export default ResetPasswordScreen;
