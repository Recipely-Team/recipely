import { StyleSheet, View } from 'react-native';
import type { DiaryDay } from '@domain/diary/day/diary-day';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { diarySizes, fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface SummaryStatsProps {
  day: DiaryDay;
}

/** Eaten · Goal · Remaining (or Over) beside the ring. */
export const SummaryStats = ({ day }: SummaryStatsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().diary;
  const kcal = t().nutrition.kcal;
  const isOver = day.overCalories > ValueConstants.zero;
  const line = (label: string, value: number, strong: boolean): React.JSX.Element => (
    <View style={styles.line} accessible>
      <SizedText size={strong ? fontSizes.caption : fontSizes.small} weight={strong ? fontWeights.bold : undefined} muted={!strong}>
        {label}
      </SizedText>
      <SizedText size={strong ? fontSizes.heading : fontSizes.medium} weight={strong ? fontWeights.bold : fontWeights.semibold}>
        {`${formatWholeNumber(value, locale)} ${kcal}`}
      </SizedText>
    </View>
  );
  return (
    <View style={styles.column}>
      {line(strings.eaten, day.totals.calories, false)}
      {line(strings.goal, day.goals.calories, false)}
      <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
      {isOver ? line(strings.over, day.overCalories, true) : line(strings.remaining, day.remainingCalories, true)}
    </View>
  );
};

const styles = StyleSheet.create({
  column: { flex: ValueConstants.one, minWidth: diarySizes.summaryStatsMinWidth, gap: spacing.xs2 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth },
});
