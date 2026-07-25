import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontSizes, fontWeights, iconSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { OnboardingReveal } from '@presentation/app/onboarding/items/onboarding-reveal';
import type { HeroProps } from '@presentation/app/onboarding/model/hero-props';

const CARD_WIDTH = 264;
const HEADER_ICON = 30;
const BULLET = 16;
const CREATE_BTN_HEIGHT = 40;
const CARD_DELAY_MS = 40;
const CHIPS_DELAY_MS = 200;
const RESULT_DELAY_MS = 420;
/** Relative widths of the three "generated result" placeholder bars. */
const RESULT_BAR_WIDTHS = ['100%', '82%', '66%'] as const;

/** Floating "generate with AI" illustration: a prompt card with ingredient chips. */
export const HeroAI = ({ active = true }: HeroProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const m = t().onboarding.mock;
  const chips = [m.aiChipOne, m.aiChipTwo, m.aiChipThree, m.aiChipFour];

  return (
    <OnboardingReveal
      active={active}
      delay={CARD_DELAY_MS}
      style={[
        styles.card,
        shadows.lg,
        { backgroundColor: colors.surface, borderColor: colors.cardBorder },
      ]}
    >
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
          style={styles.headerIcon}
        >
          <Ionicons name="sparkles" size={iconSizes.md} color={colors.onOverlay} />
        </LinearGradient>
        <ThemedText style={styles.headerLabel}>{m.aiTitle}</ThemedText>
      </View>

      <OnboardingReveal active={active} delay={CHIPS_DELAY_MS} style={styles.chips}>
        {chips.map((chip) => (
          <View
            key={chip}
            style={[styles.chip, { backgroundColor: colors.chipBackground }]}
          >
            <ThemedText style={[styles.chipText, { color: colors.chipText }]}>
              {chip}
            </ThemedText>
          </View>
        ))}
      </OnboardingReveal>

      <OnboardingReveal active={active} delay={RESULT_DELAY_MS} style={styles.resultLines}>
        {RESULT_BAR_WIDTHS.map((width, i) => (
          <View key={i} style={styles.resultRow}>
            <View style={[styles.bullet, { backgroundColor: colors.chipBackground }]}>
              <Ionicons name="checkmark" size={fontSizes.micro} color={colors.primary} />
            </View>
            <View style={[styles.bar, { width, backgroundColor: colors.cardBorder }]} />
          </View>
        ))}
      </OnboardingReveal>

      <View style={[styles.createBtn, { backgroundColor: colors.primary }]}>
        <Ionicons name="sparkles" size={fontSizes.small} color={colors.primaryText} />
        <ThemedText style={[styles.createLabel, { color: colors.primaryText }]}>
          {m.aiCreate}
        </ThemedText>
      </View>
    </OnboardingReveal>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    padding: spacing.lg,
    borderRadius: radii.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: HEADER_ICON,
    height: HEADER_ICON,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.heavy,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs2,
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm2,
    borderRadius: radii.round,
  },
  chipText: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
  },
  resultLines: {
    gap: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bullet: {
    width: BULLET,
    height: BULLET,
    borderRadius: BULLET / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    height: spacing.sm,
    borderRadius: radii.xs,
  },
  createBtn: {
    height: CREATE_BTN_HEIGHT,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
  },
  createLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
});
