import { useCallback, useEffect, useState } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { authFormMessage } from '@presentation/base/errors/auth-form-message';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, controlSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { computeRemaining, formatCountdown, SECOND_MS } from '@presentation/app/verify-code/model/countdown';
import { CharConstants, RegexConstants, ValueConstants } from '@core/constants';

const CODE_LENGTH = 6;

export interface VerifyCodeCardProps {
  email: string;
  initialExpiresAt: string;
}

/**
 * OTP entry card: code input, verify button, expiry countdown, and resend.
 * Owns the code/countdown state and the verify/resend calls; resend is locked
 * until the current code expires. The parent chooses the surrounding layout.
 */
export const VerifyCodeCard = ({ email, initialExpiresAt }: VerifyCodeCardProps): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;

  const { authStore } = useStores();
  const isLoading = authStore((s) => s.state.status === StoreStatus.Loading);
  const verifyRegistration = authStore((s) => s.verifyRegistration);
  const resendRegistrationCode = authStore((s) => s.resendRegistrationCode);

  const [code, setCode] = useState(CharConstants.empty);
  const [focused, setFocused] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>(undefined);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  // Absolute expiry of the current code; the countdown derives from it so it
  // stays correct across re-renders and app backgrounding.
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);
  const [remaining, setRemaining] = useState(() => computeRemaining(initialExpiresAt));

  useEffect(() => {
    setRemaining(computeRemaining(expiresAt));
    if (expiresAt.length === ValueConstants.zero) return;
    const id = setInterval(() => setRemaining(computeRemaining(expiresAt)), SECOND_MS);
    return () => clearInterval(id);
  }, [expiresAt]);

  const codeValid = code.length === CODE_LENGTH && RegexConstants.digitsOnly.test(code);
  const errorMessage = localError;

  const handleVerify = useCallback(async () => {
    if (!codeValid) {
      setLocalError(t().verify.errorCode);
      return;
    }
    setLocalError(undefined);
    const failure = await verifyRegistration(email, code);
    if (failure) {
      setLocalError(
        authFormMessage(failure, {
          unauthorized: t().verify.invalidCode,
          validation: t().verify.invalidCode,
          not_found: t().verify.invalidCode,
        }),
      );
    }
  }, [codeValid, verifyRegistration, email, code]);

  // Resend is locked until the current code expires.
  const canResend = remaining <= ValueConstants.zero && !resending;

  const handleResend = useCallback(async () => {
    if (remaining > ValueConstants.zero || resending) return;
    setResending(true);
    setResent(false);
    setLocalError(undefined);
    const result = await resendRegistrationCode(email);
    setResending(false);
    if (result.ok) {
      setResent(true);
      setExpiresAt(result.value.expiresAt);
    } else {
      setLocalError(authFormMessage(result.failure, {}));
    }
  }, [remaining, resending, resendRegistrationCode, email]);

  return (
    <>
      <TextInput
        style={[
          styles.codeInput,
          {
            backgroundColor: colors.inputBackground,
            color: colors.text,
            borderColor: focused ? colors.inputBorderFocused : colors.inputBorder,
          },
        ]}
        placeholder={t().verify.codePlaceholder}
        placeholderTextColor={colors.textMuted}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, CharConstants.empty).slice(ValueConstants.zero, CODE_LENGTH))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={CODE_LENGTH}
        returnKeyType="done"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={() => { void handleVerify(); }}
        accessibilityLabel={t().verify.codePlaceholder}
      />

      {errorMessage !== undefined ? (
        <View style={styles.error}>
          <FormBanner message={errorMessage} />
        </View>
      ) : null}

      {resent ? (
        <ThemedText variant="caption" style={[styles.notice, { color: colors.success }]}>
          {t().verify.resent}
        </ThemedText>
      ) : null}

      <View style={styles.buttonRow}>
        <PrimaryButton
          label={isLoading ? t().verify.verifying : t().verify.verify}
          onPress={() => { void handleVerify(); }}
          loading={isLoading}
          disabled={!codeValid || isLoading}
        />
      </View>

      <View style={styles.expiryRow}>
        {remaining > ValueConstants.zero ? (
          <ThemedText variant="caption" muted>
            {t().verify.expiresIn} {formatCountdown(remaining)}
          </ThemedText>
        ) : (
          <ThemedText variant="caption" style={{ color: colors.danger }}>
            {t().verify.expired}
          </ThemedText>
        )}
      </View>

      <View style={styles.resendRow}>
        <ThemedText variant="caption" muted>
          {t().verify.noCode}
        </ThemedText>
        <Pressable
          onPress={() => { void handleResend(); }}
          disabled={!canResend}
          accessibilityRole="button"
          accessibilityLabel={t().verify.resend}
        >
          <ThemedText
            variant="caption"
            style={{ color: canResend ? colors.primary : colors.textMuted, fontWeight: fontWeights.semibold }}
          >
            {t().verify.resend}
          </ThemedText>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.back()}
        style={styles.textLink}
        accessibilityRole="button"
        accessibilityLabel={t().verify.changeEmail}
      >
        <ThemedText variant="caption" style={{ color: colors.primary, fontWeight: fontWeights.semibold }}>
          {t().verify.changeEmail}
        </ThemedText>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  codeInput: {
    minHeight: controlSizes.input,
    borderWidth: borderWidths.thin,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    fontSize: fontSizes.subtitle,
    textAlign: 'center',
    letterSpacing: spacing.sm,
  },
  error: {
    marginTop: spacing.md,
  },
  notice: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  buttonRow: {
    marginTop: spacing.lg,
  },
  expiryRow: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  textLink: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
});
