import { useCallback, useRef, useState } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { AuthTextField } from '@presentation/base/widgets/inputs/auth-text-field';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { authFormMessage } from '@presentation/base/errors/auth-form-message';
import type { Failure } from '@presentation/base/types';
import { FailureCode } from '@core/failure';
import { SocialAuthSection } from '@presentation/app/login/body/social-auth-section';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontWeights } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { CharConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';
import { enterApp } from '@presentation/navigation/enter-app';
import { isBlank } from '@core/guards/type-guards';

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
  // Page-scoped error: dies with the screen.
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const passwordRef = useRef<TextInput>(null);

  // Closing the provider sheet is an answer, not an error.
  const runSocial = useCallback(
    async (signInWith: () => Promise<Failure | null>) => {
      setErrorMessage(undefined);
      const failure = await signInWith();
      if (failure && failure.code !== FailureCode.Cancelled) {
        setErrorMessage(authFormMessage(failure, {}));
      }
    },
    [],
  );

  const fieldsEmpty = isBlank(email) || isBlank(password);

  const handleSignIn = useCallback(async () => {
    if (isBlank(email) || isBlank(password)) {
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
      <AuthTextField
        iconName="mail-outline"
        placeholder={t().login.emailPlaceholder}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <AuthTextField
        ref={passwordRef}
        iconName="lock-closed-outline"
        placeholder={t().login.passwordPlaceholder}
        value={password}
        onChangeText={setPassword}
        password
        returnKeyType="done"
        onSubmitEditing={() => { void handleSignIn(); }}
        containerStyle={styles.fieldSpacing}
      />

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

      <View style={styles.submitRow}>
        <PrimaryButton
          label={t().login.signIn}
          onPress={() => { void handleSignIn(); }}
          loading={isLoading}
          disabled={fieldsEmpty}
        />
      </View>

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
  fieldSpacing: {
    marginTop: spacing.md,
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
  submitRow: {
    marginTop: spacing.lg,
  },
});
