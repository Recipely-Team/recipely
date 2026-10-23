import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';
import { ArtCard } from '@presentation/app/onboarding/items/art-card';
import { ArtChip } from '@presentation/app/onboarding/items/art-chip';
import { OnboardingReveal } from '@presentation/app/onboarding/items/onboarding-reveal';
import type { HeroProps } from '@presentation/app/onboarding/model/hero-props';
import { CharConstants, ValueConstants } from '@core/constants';

const SOURCE_SEPARATOR = CharConstants.middotSpaced;
const CHIP_STEP_MS = 60;
const LINK_DELAY_MS = 260;
const RECIPE_DELAY_MS = 420;
const UNITS_DELAY_MS = 820;
/** Ingredient lines: the first at 900 ms, then every 90 ms. */
const LINE_DELAY_START_MS = 900;
const LINE_DELAY_STEP_MS = 90;
/** An example link: what a pasted reel looks like, not a real post. */
const SAMPLE_LINK = 'instagram.com/reel/…';
const ART_WIDTH = 270;

/** Slide 1, "Save recipes from anywhere": the sources, a pasted link, and the recipe it became. */
export const HeroImport = ({ active = true }: HeroProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const a = t.onboarding.art;
  return (
    <View style={styles.root}>
      <View style={styles.chips}>
        {a.sources.split(SOURCE_SEPARATOR).map((source, i) => (
          <ArtChip key={source} label={source} active={active} delay={i * CHIP_STEP_MS} strong={i === ValueConstants.zero} />
        ))}
      </View>
      <ArtCard active={active} delay={LINK_DELAY_MS} style={styles.link}>
        <Ionicons name="link-outline" size={iconSizes.sm} color={colors.textMuted} />
        <SizedText size={fontSizes.caption} color={colors.textMuted} style={styles.grow} numberOfLines={ValueConstants.one}>
          {SAMPLE_LINK}
        </SizedText>
        <Ionicons name="checkmark-circle" size={iconSizes.md} color={colors.success} />
      </ArtCard>
      <ArtCard active={active} delay={RECIPE_DELAY_MS}>
        <View style={styles.titleRow}>
          <SizedText size={fontSizes.body} weight={fontWeights.bold} style={styles.grow}>{a.recipe}</SizedText>
          <ArtChip label={a.langUnits} active={active} delay={UNITS_DELAY_MS} />
        </View>
        {[a.ing1, a.ing2, a.ing3].map((line, i) => (
          <ArtLine key={line} text={line} active={active} delay={LINE_DELAY_START_MS + i * LINE_DELAY_STEP_MS} />
        ))}
      </ArtCard>
    </View>
  );
};

const ArtLine = ({ text, active, delay }: { text: string; active: boolean; delay: number }): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <OnboardingReveal active={active} delay={delay} style={[styles.line, { borderColor: colors.cardBorder }]}>
      <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
      <SizedText size={fontSizes.caption}>{text}</SizedText>
    </OnboardingReveal>
  );
};

const styles = StyleSheet.create({
  root: { width: ART_WIDTH, gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: ValueConstants.one },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: borderWidths.hairline, paddingBottom: spacing.xs },
  bullet: { width: spacing.xs, height: spacing.xs, borderRadius: radii.round },
});
