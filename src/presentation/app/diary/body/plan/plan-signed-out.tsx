import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { RoutePaths } from '@presentation/base/constants';
import { borderWidths, fontWeights, iconSizes, mealPlanSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

/**
 * The Plan view for a guest (design spec → Meal planner, States 4): a lock
 * disc, why to sign in, and Sign in / Create account. Both come back to the
 * plan afterwards.
 */
export const PlanSignedOut = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const router = useRouter();
  const strings = t().mealPlan;
  const redirect = `${RoutePaths.diary}?mode=plan`;
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={[styles.disc, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="lock-closed" size={iconSizes.xl} color={colors.chipText} />
      </View>
      <SizedText size={mealPlanSizes.emptyTitle} weight={fontWeights.heavy} style={styles.center} accessibilityRole="header">
        {strings.signedOutTitle}
      </SizedText>
      <SizedText size={mealPlanSizes.emptyBody} color={colors.textMuted} style={[styles.center, styles.body]}>
        {strings.signedOutBody}
      </SizedText>
      <View style={styles.actions}>
        <PrimaryButton label={strings.signIn} onPress={() => router.push({ pathname: RoutePaths.login, params: { redirect } })} />
        <Pressable
          onPress={() => router.push({ pathname: RoutePaths.register, params: { redirect } })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.ghost, { borderColor: colors.cardBorder, opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
        >
          <SizedText size={mealPlanSizes.emptyBody} weight={fontWeights.bold}>
            {strings.createAccount}
          </SizedText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
  disc: { width: mealPlanSizes.lockDisc, height: mealPlanSizes.lockDisc, borderRadius: radii.round, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  body: { maxWidth: mealPlanSizes.emptyBodyMaxWidth },
  actions: { alignSelf: 'stretch', gap: spacing.sm, maxWidth: mealPlanSizes.emptyBodyMaxWidth, width: '100%', marginHorizontal: 'auto' },
  ghost: { minHeight: mealPlanSizes.cta, borderRadius: radii.round, borderWidth: borderWidths.hairline, alignItems: 'center', justifyContent: 'center' },
});
