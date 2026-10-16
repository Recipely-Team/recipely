import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { borderWidths, controlSizes, fontSizes, fontWeights, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface OnboardingActionsProps {
  web?: boolean;
  onSignUp: () => void;
  onSignIn: () => void;
}

/** Create account weighs one and a half Sign in (Onboarding 2026). */
const CREATE_GROW = 1.5;
/** Web minimum widths (Onboarding 2026 spec): Sign in 140, Create account 200. */
const SIGN_IN_WEB_MIN = 140;
const CREATE_WEB_MIN = 200;

/**
 * Sign in (secondary) and Create account (primary). Skip lives in the top bar;
 * the old "Explore" and "Don't show again" links did the same thing it does.
 */
export const OnboardingActions = ({ web = false, onSignUp, onSignIn }: OnboardingActionsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const labels = t().onboarding;
  return (
    <View style={[styles.row, web && styles.rowWeb]}>
      <Pressable
        onPress={onSignIn}
        accessibilityRole="button"
        accessibilityLabel={labels.signIn}
        style={({ pressed }) => [
          styles.button,
          web ? styles.signInWeb : styles.signIn,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder, opacity: pressed ? opacities.pressed : opacities.full },
        ]}
      >
        <ThemedText style={[styles.label, { color: colors.text }]}>{labels.signIn}</ThemedText>
      </Pressable>
      <Pressable
        onPress={onSignUp}
        accessibilityRole="button"
        accessibilityLabel={labels.signUp}
        style={({ pressed }) => [
          styles.button,
          shadows.md,
          web ? styles.createWeb : styles.create,
          { backgroundColor: colors.primary, borderColor: colors.primary, opacity: pressed ? opacities.pressed : opacities.full },
        ]}
      >
        <ThemedText style={[styles.label, { color: colors.primaryText }]}>{labels.signUp}</ThemedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm2 },
  rowWeb: { flexWrap: 'wrap', gap: spacing.md },
  button: {
    minHeight: controlSizes.button,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  signIn: { flex: ValueConstants.one },
  create: { flex: CREATE_GROW },
  signInWeb: { minWidth: SIGN_IN_WEB_MIN },
  createWeb: { minWidth: CREATE_WEB_MIN },
  label: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
});
