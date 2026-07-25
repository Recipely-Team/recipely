import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { UseOnboardingResult } from '@presentation/app/onboarding/model/use-onboarding-result';
import { ValueConstants } from '@core/constants';

const PRIMARY_BORDER = 1.5;

export interface OnboardingActionsProps extends UseOnboardingResult {
  /** Web lays the explore/dismiss links side by side; mobile stacks them centered. */
  web?: boolean;
}

/** Entry-action cluster: sign-up/sign-in buttons plus explore and dismiss links. */
export const OnboardingActions = ({
  web = false,
  onSignUp,
  onSignIn,
  onExplore,
  onDismiss,
}: OnboardingActionsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const labels = t().onboarding;

  return (
    <View style={styles.root}>
      <View style={styles.buttonRow}>
        <Pressable
          onPress={onSignUp}
          accessibilityRole="button"
          accessibilityLabel={labels.signUp}
          style={({ pressed }) => [
            styles.button,
            { borderColor: colors.primary, opacity: pressed ? opacities.pressed : opacities.full },
          ]}
        >
          <ThemedText style={[styles.buttonLabel, { color: colors.primary }]}>
            {labels.signUp}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={onSignIn}
          accessibilityRole="button"
          accessibilityLabel={labels.signIn}
          style={({ pressed }) => [
            styles.button,
            shadows.md,
            {
              borderColor: colors.primary,
              backgroundColor: colors.primary,
              opacity: pressed ? opacities.pressed : opacities.full,
            },
          ]}
        >
          <ThemedText style={[styles.buttonLabel, { color: colors.primaryText }]}>
            {labels.signIn}
          </ThemedText>
        </Pressable>
      </View>

      <View style={web ? styles.linksWeb : styles.linksMobile}>
        <Pressable
          onPress={onExplore}
          accessibilityRole="button"
          accessibilityLabel={labels.explore}
          style={({ pressed }) => [
            styles.exploreLink,
            { opacity: pressed ? opacities.pressed : opacities.full },
          ]}
        >
          <ThemedText style={styles.exploreLabel}>{labels.explore}</ThemedText>
          <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.primary} />
        </Pressable>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={labels.dontShow}
          style={({ pressed }) => [
            styles.dismissLink,
            { opacity: pressed ? opacities.pressed : opacities.full },
          ]}
        >
          <ThemedText muted style={styles.dismissLabel}>
            {labels.dontShow}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: ValueConstants.one,
    minHeight: controlSizes.button,
    borderRadius: radii.lg,
    borderWidth: PRIMARY_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
  linksMobile: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  linksWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg2,
  },
  exploreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    paddingVertical: spacing.xs,
  },
  exploreLabel: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  dismissLink: {
    paddingVertical: spacing.xxs,
  },
  dismissLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
});
