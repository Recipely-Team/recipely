import { useCallback, useRef, useState } from 'react';
import { AuthField } from '@presentation/app/login/model/auth-field';
import { StoreStatus } from '@application/store/store-status';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { authFormMessage } from '@presentation/base/errors/auth-form-message';
import type { Failure } from '@presentation/base/types';
import { SocialAuthSection } from '@presentation/app/login/body/social-auth-section';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, controlSizes, borderWidths, zIndices, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';
import { enterApp } from '@presentation/navigation/enter-app';

/**
 * Login form (email / password) with inline error, forgot-password link, submit,
 * and the social/guest section. Owns the credentials state and the sign-in call;
 * the parent screen only chooses the surrounding layout.
 */
export const LoginForm = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;

  const { authStore } = useStores();
  const isLoading = authStore((s) => s.state.status === StoreStatus.Loading);
  const signIn = authStore((s) => s.signIn);
  const signInWithGoogle = authStore((s) => s.signInWithGoogle);
  const signInWithApple = authStore((s) => s.signInWithApple);

  const [email, setEmail] = useState(CharConstants.empty);
  const [password, setPassword] = useState(CharConstants.empty);
  const [focusField, setFocusField] = useState<AuthField | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  // Page-scoped error: it lives with this screen and dies when it unmounts, so
  // a failed sign-in never bleeds onto register / other auth screens.
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const passwordRef = useRef<TextInput>(null);

  const runSocial = useCallback(
    async (signInWith: () => Promise<Failure | null>) => {
      setErrorMessage(undefined);
      const failure = await signInWith();
      if (failure) {
        setErrorMessage(authFormMessage(failure, {}));
      }
    },
    [],
  );

  const fieldsEmpty = email.trim().length === ValueConstants.zero || password.trim().length === ValueConstants.zero;

  const handleSignIn = useCallback(async () => {
    if (email.trim().length === ValueConstants.zero || password.trim().length === ValueConstants.zero) {
      return;
    }
    setErrorMessage(undefined);
    const failure = await signIn(email, password);
    if (failure) {
      setErrorMessage(
        authFormMessage(failure, {
          unauthorized: t().login.invalidCredentials,
          validation: t().login.invalidCredentials,
        }),
      );
    }
  }, [signIn, email, password]);

  return (
    <>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons
          name="email-outline"
          size={20}
          color={colors.textMuted}
          style={styles.inputIcon}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderColor:
                focusField === AuthField.Email ? colors.inputBorderFocused : colors.inputBorder,
            },
          ]}
          placeholder={t().login.emailPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="next"
          onFocus={() => setFocusField(AuthField.Email)}
          onBlur={() => setFocusField(null)}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
      </View>

      <View style={[styles.inputWrapper, { marginTop: spacing.md }]}>
        <MaterialCommunityIcons
          name="lock-outline"
          size={20}
          color={colors.textMuted}
          style={styles.inputIcon}
        />
        <TextInput
          ref={passwordRef}
          style={[
            styles.input,
            styles.passwordInput,
            {
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderColor:
                focusField === AuthField.Password ? colors.inputBorderFocused : colors.inputBorder,
            },
          ]}
          placeholder={t().login.passwordPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          returnKeyType="done"
          onFocus={() => setFocusField(AuthField.Password)}
          onBlur={() => setFocusField(null)}
          onSubmitEditing={() => { void handleSignIn(); }}
        />
        <Pressable
          onPress={() => setShowPassword((visible) => !visible)}
          hitSlop={8}
          style={styles.eyeButton}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? t().login.hidePassword : t().login.showPassword}
        >
          <MaterialCommunityIcons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={colors.textMuted}
          />
        </Pressable>
      </View>

      {errorMessage ? (
        <View style={styles.error}>
          <FormBanner message={errorMessage} />
        </View>
      ) : null}

      <Pressable
        onPress={() => router.push(RoutePaths.forgotPassword)}
        style={styles.forgotRow}
        accessibilityRole="button"
        accessibilityLabel={t().login.forgotPassword}
      >
        <ThemedText variant="caption" style={[styles.forgotLabel, { color: colors.primary }]}>
          {t().login.forgot}
        </ThemedText>
      </Pressable>

      <Pressable
        onPress={() => { void handleSignIn(); }}
        disabled={fieldsEmpty || isLoading}
        style={[
          styles.signInButton,
          { backgroundColor: colors.primary },
          fieldsEmpty || isLoading ? styles.buttonDisabled : null,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <ThemedText variant="body" style={[styles.signInLabel, { color: colors.primaryText }]}>
            {t().login.signIn}
          </ThemedText>
        )}
      </Pressable>

      <SocialAuthSection
        disabled={isLoading}
        onGoogle={() => { void runSocial(signInWithGoogle); }}
        onApple={() => { void runSocial(signInWithApple); }}
        onSignUp={() => router.push(RoutePaths.register)}
        onGuest={() => enterApp(router, RoutePaths.recipes)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: zIndices.raised,
  },
  input: {
    minHeight: controlSizes.input,
    borderWidth: borderWidths.thin,
    borderRadius: radii.lg,
    paddingLeft: spacing.xxxl,
    paddingRight: spacing.lg,
    fontSize: fontSizes.body,
  },
  passwordInput: {
    paddingRight: controlSizes.iconBtn + spacing.sm,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.sm,
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: spacing.md,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  forgotLabel: {
    fontWeight: fontWeights.semibold,
  },
  signInButton: {
    minHeight: controlSizes.button,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: opacities.disabled,
  },
  signInLabel: {
    fontWeight: fontWeights.semibold,
  },
});
