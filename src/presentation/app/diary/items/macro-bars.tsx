import { StyleSheet, View } from 'react-native';
import type { DiaryDay } from '@domain/diary/day/diary-day';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useDiaryTones } from '@presentation/base/theme/colors/tones/use-diary-tones';
import { diarySizes, spacing } from '@presentation/base/theme';
import { MacroBar } from '@presentation/app/diary/items/macro-bar';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface MacroBarsProps {
  day: DiaryDay;
  /** Web: four stacked bars. Mobile: a 2 × 2 grid. */
  stacked: boolean;
}

/** Under half, so two cells and the column gap share a row and a third wraps. */
const TWO_UP_BASIS = '40%';

/**
 * Protein, carbs, fat and fiber against their goals. P/C/F past the goal draw
 * in the "over" tone; fiber never does — more fiber is not a warning
 * (design spec → Food Diary §4).
 */
export const MacroBars = ({ day, stacked }: MacroBarsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const tones = useDiaryTones();
  const strings = t().nutrition;
  const { totals, goals } = day;
  const ink = (value: number | null, goal: number, canBeOver: boolean): string =>
    canBeOver && value !== null && value > goal ? tones.over.solid : colors.primary;
  const bars = [
    { key: 'protein', label: strings.protein, value: totals.protein, goal: goals.protein, color: ink(totals.protein, goals.protein, true) },
    { key: 'carbs', label: strings.carbs, value: totals.carbs, goal: goals.carbs, color: ink(totals.carbs, goals.carbs, true) },
    { key: 'fat', label: strings.fat, value: totals.fat, goal: goals.fat, color: ink(totals.fat, goals.fat, true) },
    { key: 'fiber', label: strings.fiber, value: totals.fiber, goal: goals.fiber, color: ink(totals.fiber, goals.fiber, false) },
  ];
  return (
    <View style={stacked ? styles.stack : styles.grid}>
      {bars.map((bar) => (
        <View key={bar.key} style={stacked ? null : styles.cell}>
          <MacroBar label={bar.label} value={bar.value} goal={bar.goal} color={bar.color} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: diarySizes.macroGapRow, columnGap: diarySizes.macroGapColumn },
  cell: { flexGrow: ValueConstants.one, flexBasis: TWO_UP_BASIS },
});
