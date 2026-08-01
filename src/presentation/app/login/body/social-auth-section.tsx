import { Pressable, StyleSheet, View } from 'react-native';
import { isAndroid } from '@infrastructure/constants/platform';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { SocialSignInButton } from '@presentation/app/login/items/social-sign-in-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontWeights, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface SocialAuthSectionProps {
  disabled: boolean;
  onGoogle: () => void;
  onApple: () => void;
  onSignUp: () => void;
  onGuest: () => void;
}

/**
 * Divider + Google/Apple sign-in buttons and the sign-up / continue-as-guest
 * links below the login form. Apple sign-in is hidden on Android.
 */
export const SocialAuthSection = ({
  disabled,
  onGoogle,
  onApple,
  onSignUp,
  onGuest,
}: SocialAuthSectionProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <>
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.inputBorder }]} />
        <ThemedText variant="caption" muted style={styles.dividerLabel}>
          {t().login.orContinueWith}
        </ThemedText>
        <View style={[styles.dividerLine, { backgroundColor: colors.inputBorder }]} />
      </View>

      <SocialSignInButton
        provider="google"
        label={t().login.signInWithGoogle}
        onPress={onGoogle}
        disabled={disabled}
        borderColor={colors.inputBorder}
      />

      {!isAndroid() && (
        <SocialSignInButton
          provider="apple"
          label={t().login.signInWithApple}
          onPress={onApple}
          disabled={disabled}
          borderColor={colors.inputBorder}
        />
      )}

      <View style={styles.signUpRow}>
        <ThemedText variant="body" style={{ color: colors.textMuted }}>
          {t().login.noAccount}
        </ThemedText>
        <Pressable
          onPress={onSignUp}
          accessibilityRole="button"
          accessibilityLabel={t().login.signUp}
        >
          <ThemedText variant="body" style={[styles.signUpLink, { color: colors.primary }]}>
            {t().login.signUp}
          </ThemedText>
        </Pressable>
      </View>

      <Pressable
        onPress={onGuest}
        style={styles.guestRow}
        accessibilityRole="button"
        accessibilityLabel={t().login.continueAsGuest}
      >
        <ThemedText variant="caption" muted style={styles.guestLink}>
          {t().login.continueAsGuest}
        </ThemedText>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: ValueConstants.one,
    height: borderWidths.hairline,
  },
  dividerLabel: {
    flexShrink: ValueConstants.zero,
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  signUpLink: {
    fontWeight: fontWeights.semibold,
  },
  guestRow: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  guestLink: {
    textDecorationLine: 'underline',
  },
});
