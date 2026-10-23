import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { upperCase } from '@presentation/i18n/upper-case';
import { useTranslations } from '@presentation/i18n';
import { ArtCard } from '@presentation/app/onboarding/items/art-card';
import { ArtChip } from '@presentation/app/onboarding/items/art-chip';
import { OnboardingReveal } from '@presentation/app/onboarding/items/onboarding-reveal';
import type { HeroProps } from '@presentation/app/onboarding/model/hero-props';
import { ValueConstants } from '@core/constants';

/** Week rows rise in one after another: the first at 160 ms, then every 90 ms. */
const ROW_DELAY_START_MS = 160;
const ROW_DELAY_STEP_MS = 90;
const LIST_DELAY_MS = 620;
const CHECK_DELAY_MS = 1150;
/** The shopping card tilts and tucks under the week card, as in the prototype. */
const LIST_TILT = '1.5deg';
const LIST_OVERLAP = -26;
const DAY_WIDTH = 34;
const ART_WIDTH = 270;

/** Slide 3, "Plan your week": a week filled from saved recipes, and the one shopping list it makes. */
export const HeroPlan = ({ active = true }: HeroProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const a = t.onboarding.art;
  const rows = [
    [a.day1, a.meal1],
    [a.day2, a.meal2],
    [a.day3, a.meal3],
    [a.day4, a.meal4],
  ] as const;
  return (
    <View style={styles.root}>
      <ArtCard active={active} delay={ValueConstants.zero}>
        <View style={styles.head}>
          <SizedText size={fontSizes.body} weight={fontWeights.bold} style={styles.grow}>{a.week}</SizedText>
          <ArtChip label={a.fromSaved} active={active} delay={ValueConstants.zero} />
        </View>
        {rows.map(([day, meal], i) => (
          <OnboardingReveal key={day} active={active} delay={ROW_DELAY_START_MS + i * ROW_DELAY_STEP_MS} style={styles.row}>
            <SizedText size={fontSizes.tiny} weight={fontWeights.bold} color={colors.textMuted} style={styles.day}>{upperCase(day)}</SizedText>
            <SizedText size={fontSizes.caption} weight={fontWeights.semibold} numberOfLines={ValueConstants.one} style={styles.grow}>{meal}</SizedText>
          </OnboardingReveal>
        ))}
      </ArtCard>
      <ArtCard active={active} delay={LIST_DELAY_MS} style={styles.list}>
        <SizedText size={fontSizes.caption} weight={fontWeights.bold}>{a.list}</SizedText>
        {[a.item1, a.item2, a.item3].map((item, i) => {
          const isDone = i === ValueConstants.zero;
          return (
            <View key={item} style={styles.item}>
              <OnboardingReveal active={active} delay={isDone ? CHECK_DELAY_MS : LIST_DELAY_MS}>
                <View style={[styles.box, isDone ? { backgroundColor: colors.success, borderColor: colors.success } : { borderColor: colors.border }]}>
                  {isDone ? <Ionicons name="checkmark" size={iconSizes.xs} color={colors.primaryText} /> : null}
                </View>
              </OnboardingReveal>
              <SizedText
                size={fontSizes.caption}
                color={isDone ? colors.textMuted : colors.text}
                style={isDone ? styles.struck : undefined}
              >
                {item}
              </SizedText>
            </View>
          );
        })}
      </ArtCard>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { width: ART_WIDTH },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  day: { width: DAY_WIDTH },
  grow: { flex: ValueConstants.one },
  list: { marginTop: LIST_OVERLAP, marginLeft: spacing.xl, transform: [{ rotate: LIST_TILT }] },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  box: {
    width: iconSizes.md,
    height: iconSizes.md,
    borderRadius: radii.xs,
    borderWidth: borderWidths.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  struck: { textDecorationLine: 'line-through' },
});
