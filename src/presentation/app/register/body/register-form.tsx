import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { authFormMessage } from '@presentation/base/errors/auth-form-message';
import { AuthTextField } from '@presentation/app/register/items/auth-text-field';
import { PasswordStrengthMeter } from '@presentation/app/register/items/password-strength-meter';
import { TermsAgreement } from '@presentation/app/register/items/terms-agreement';
import { PasswordEyeToggle } from '@presentation/app/register/items/password-eye-toggle';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, controlSizes, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { EMAIL_RE, MIN_PASSWORD } from '@presentation/app/register/model/password-rules';
import { computeStrength } from '@presentation/app/register/model/compute-strength';
import { DISPLAY_NAME_MAX } from '@presentation/base/forms/display-name-limits';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Register form fields (name / email / password / confirm / terms) with inline
 * validation, password-strength meter, and submit. Owns all form state and the
 * sign-up call; the parent screen only chooses the surrounding layout.
 */
export const RegisterForm = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;

  const { authStore } = useStores();
  const isLoading = authStore((s) => s.state.status === 'loading');
  const register = authStore((s) => s.register);

  const [name, setName] = useState(CharConstants.empty);
  const [email, setEmail] = useState(CharConstants.empty);
  const [password, setPassword] = useState(CharConstants.empty);
  const [confirm, setConfirm] = useState(CharConstants.empty);
  const [agree, setAgree] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>(undefined);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const emailValid = EMAIL_RE.test(email);
  const passwordsMatch = password.length > ValueConstants.zero && password === confirm;
  const strength = useMemo(() => computeStrength(password), [password]);

  const canSubmit =
    name.trim().length > ValueConstants.zero &&
    emailValid &&
    password.length >= MIN_PASSWORD &&
    password === confirm &&
    agree;

  const handleRegister = useCallback(async () => {
    if (name.trim().length === ValueConstants.zero) {
      setLocalError(t().register.errorName);
      return;
    }
    if (!emailValid) {
      setLocalError(t().register.errorEmail);
      return;
    }
    if (password.length < MIN_PASSWORD) {
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
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        containerStyle={styles.fieldSpacing}
        rightSlot={
          email.length > ValueConstants.zero ? (
            <Ionicons
              name={emailValid ? 'checkmark-circle' : 'close-circle'}
              size={iconSizes.lg}
              color={emailValid ? colors.success : colors.danger}
              style={styles.inputStatusIcon}
            />
          ) : undefined
        }
      />

      <AuthTextField
        ref={passwordRef}
        iconName="lock-closed-outline"
        placeholder={t().register.passwordPlaceholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPwd}
        autoCapitalize="none"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        containerStyle={styles.passwordSpacing}
        rightSlot={
          <View style={styles.eyeButton}>
            <PasswordEyeToggle visible={showPwd} onToggle={() => setShowPwd((s) => !s)} />
          </View>
        }
      />

      {password.length > ValueConstants.zero ? <PasswordStrengthMeter strength={strength} /> : null}

      <AuthTextField
        ref={confirmRef}
        iconName="lock-closed-outline"
        placeholder={t().register.confirmPlaceholder}
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry={!showConfirm}
        autoCapitalize="none"
        returnKeyType="done"
        onSubmitEditing={() => { void handleRegister(); }}
        containerStyle={styles.fieldSpacing}
        rightSlot={
          <View style={styles.confirmRight}>
            {confirm.length > ValueConstants.zero ? (
              <Ionicons
                name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
                size={iconSizes.lg}
                color={passwordsMatch ? colors.success : colors.danger}
              />
            ) : null}
            <PasswordEyeToggle visible={showConfirm} onToggle={() => setShowConfirm((s) => !s)} />
          </View>
        }
      />

      <TermsAgreement agree={agree} onToggle={() => setAgree((a) => !a)} />

      {errorMessage !== undefined ? (
        <View style={styles.error}>
          <FormBanner message={errorMessage} />
        </View>
      ) : null}

      <Pressable
        onPress={() => { void handleRegister(); }}
        disabled={!canSubmit || isLoading}
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary },
          !canSubmit || isLoading ? styles.submitDisabled : null,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <ThemedText variant="body" style={[styles.submitLabel, { color: colors.primaryText }]}>
            {t().register.signUp}
          </ThemedText>
        )}
      </Pressable>

      <View style={styles.signInRow}>
        <ThemedText variant="caption" style={{ color: colors.textMuted }}>
          {t().register.haveAccount}
        </ThemedText>
        <Pressable onPress={() => router.back()}>
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
  inputStatusIcon: {
    position: 'absolute',
    right: spacing.lg,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.sm,
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRight: {
    position: 'absolute',
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  error: {
    marginTop: spacing.md,
  },
  submitButton: {
    minHeight: controlSizes.button,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  submitDisabled: {
    opacity: opacities.disabled,
  },
  submitLabel: {
    fontWeight: fontWeights.semibold,
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
});
