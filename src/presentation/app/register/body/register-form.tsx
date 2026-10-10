import { useCallback, useMemo, useRef, useState } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBackOrHome } from '@presentation/base/hooks/navigation/use-go-back-or-home';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { authFormMessage } from '@presentation/base/errors/auth-form-message';
import { AuthTextField } from '@presentation/base/widgets/inputs/auth-text-field';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { PasswordStrengthMeter } from '@presentation/app/register/items/password-strength-meter';
import { TermsAgreement } from '@presentation/app/register/items/terms-agreement';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontWeights, targetSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { DISPLAY_NAME_MAX } from '@presentation/base/forms/display-name-limits';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';
import { Email } from '@domain/common/email';
import { Password } from '@domain/auth/password';
import { isBlank } from '@core/guards/type-guards';

/**
 * Register form fields (name / email / password / confirm / terms) with inline
 * validation, password-strength meter, and submit. Owns all form state and the
 * sign-up call; the parent screen only chooses the surrounding layout.
 */
export const RegisterForm = (): React.JSX.Element => {
  const router = useRouter();
  const goBack = useGoBackOrHome(RoutePaths.login);
  const colors = useTheme().colors;

  const { authStore } = useStores();
  const isLoading = authStore((s) => s.state.status === StoreStatus.Loading);
  const register = authStore((s) => s.register);

  const [name, setName] = useState(CharConstants.empty);
  const [email, setEmail] = useState(CharConstants.empty);
  const [password, setPassword] = useState(CharConstants.empty);
  const [confirm, setConfirm] = useState(CharConstants.empty);
  const [agree, setAgree] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>(undefined);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const emailValid = Email.create(email).ok;
  const passwordsMatch = password.length > ValueConstants.zero && password === confirm;
  const strength = useMemo(() => Password.strengthOf(password), [password]);

  const canSubmit =
    !isBlank(name) &&
    emailValid &&
    Password.create(password).ok &&
    password === confirm &&
    agree;

  const handleRegister = useCallback(async () => {
    if (isBlank(name)) {
      setLocalError(t().register.errorName);
      return;
    }
    if (!emailValid) {
      setLocalError(t().register.errorEmail);
      return;
    }
    if (!Password.create(password).ok) {
      setLocalError(t().register.errorPwdShort);
      return;
    }
    if (password !== confirm) {
      setLocalError(t().register.errorMismatch);
      return;
    }
    if (!agree) {
      setLocalError(t().register.errorAgree);
      return;
    }
    setLocalError(undefined);
    const result = await register(email, password, name);
    if (result.ok) {
      router.push({
        pathname: RoutePaths.verifyCode,
        params: {
          email: result.value.email,
          expiresAt: result.value.expiresAt,
        },
      });
    } else {
      setLocalError(authFormMessage(result.failure, { conflict: t().register.emailTaken }));
    }
  }, [name, email, emailValid, password, confirm, agree, register, router]);

  const errorMessage = localError;

  return (
    <>
      <AuthTextField
        iconName="person-outline"
        placeholder={t().register.namePlaceholder}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        returnKeyType="next"
        maxLength={DISPLAY_NAME_MAX}
        onSubmitEditing={() => emailRef.current?.focus()}
      />

      <AuthTextField
        ref={emailRef}
        iconName="mail-outline"
        placeholder={t().register.emailPlaceholder}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        returnKeyType="next"
        valid={email.length > ValueConstants.zero ? emailValid : undefined}
        onSubmitEditing={() => passwordRef.current?.focus()}
        containerStyle={styles.fieldSpacing}
      />

      <AuthTextField
        ref={passwordRef}
        iconName="lock-closed-outline"
        placeholder={t().register.passwordPlaceholder}
        value={password}
        onChangeText={setPassword}
        password
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        containerStyle={styles.passwordSpacing}
      />

      {password.length > ValueConstants.zero ? <PasswordStrengthMeter strength={strength} /> : null}

      <AuthTextField
        ref={confirmRef}
        iconName="lock-closed-outline"
        placeholder={t().register.confirmPlaceholder}
        value={confirm}
        onChangeText={setConfirm}
        password
        returnKeyType="done"
        valid={confirm.length > ValueConstants.zero ? passwordsMatch : undefined}
        onSubmitEditing={() => { void handleRegister(); }}
        containerStyle={styles.fieldSpacing}
      />

      <TermsAgreement agree={agree} onToggle={() => setAgree((a) => !a)} />

      {errorMessage !== undefined ? (
        <View style={styles.error}>
          <FormBanner message={errorMessage} />
        </View>
      ) : null}

      <View style={styles.submitRow}>
        <PrimaryButton
          label={t().register.signUp}
          onPress={() => { void handleRegister(); }}
          loading={isLoading}
          disabled={!canSubmit}
        />
      </View>

      <View style={styles.signInRow}>
        <ThemedText variant="caption" style={{ color: colors.textMuted }}>
          {t().register.haveAccount}
        </ThemedText>
        <Pressable accessibilityRole="link" onPress={goBack} style={styles.linkTarget}>
          <ThemedText variant="caption" style={[styles.signInLink, { color: colors.primary }]}>
            {t().register.signIn}
          </ThemedText>
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  fieldSpacing: {
    marginTop: spacing.md,
  },
  passwordSpacing: {
    marginTop: spacing.md,
    marginBottom: spacing.xs2,
  },
  error: {
    marginTop: spacing.md,
  },
  submitRow: {
    marginTop: spacing.md,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  signInLink: {
    fontWeight: fontWeights.semibold,
  },
  linkTarget: {
    minHeight: targetSizes.min,
    justifyContent: 'center',
  },
});
