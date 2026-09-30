import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { diarySizes, fontSizes, fontWeights, lineHeights, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface MacroBarProps {
  label: string;
  /** Grams eaten; null when nothing logged reported this macro. */
  value: number | null;
  goal: number;
  /** The bar's ink — `primary`, or the over tone's `solid` past the goal. */
  color: string;
}

const VALUE_SLOT = '{v}';
const PERCENT = 100;

/** One macro of the summary: "Protein", "62 / 120 g" and a 6pt bar (design spec → Food Diary §4). */
export const MacroBar = ({ label, value, goal, color }: MacroBarProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  // The template places the value; splitting on it keeps that order in every language and lets the value alone be bold.
  const [before = CharConstants.empty, after = CharConstants.empty] = t()
    .diary.macroOfGoal.replace('{g}', formatWholeNumber(goal, locale))
    .split(VALUE_SLOT);
  const share = value === null || goal <= ValueConstants.zero ? ValueConstants.zero : Math.min(ValueConstants.one, value / goal);
  return (
    <View style={styles.root} accessible>
      <View style={styles.labels}>
        <SizedText size={fontSizes.caption} weight={fontWeights.semibold}>
          {label}
        </SizedText>
        <SizedText size={fontSizes.small} muted ratio={lineHeights.normal}>
          {before}
          <SizedText size={fontSizes.small} weight={fontWeights.bold}>
            {value === null ? CharConstants.emDash : formatWholeNumber(value, locale)}
          </SizedText>
          {after}
        </SizedText>
      </View>
      <View style={[styles.track, { backgroundColor: colors.skeleton }]}>
        <View style={[styles.fill, { backgroundColor: color, width: `${share * PERCENT}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  labels: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: spacing.xs },
  track: { height: diarySizes.macroBar, borderRadius: diarySizes.macroBarRadius, overflow: 'hidden' },
  fill: { height: diarySizes.macroBar, borderRadius: diarySizes.macroBarRadius },
});
