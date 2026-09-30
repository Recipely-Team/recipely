import { StyleSheet, View } from 'react-native';
import type { DiaryMonthStats } from '@domain/diary/month/diary-month-stats';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { borderWidths, fontSizes, fontWeights, lineHeights, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface MonthStatsTilesProps {
  /** Null while the month loads — every tile then reads "—". */
  stats: DiaryMonthStats | null;
}

/** Daily average · days on target · logging streak, with the footnote on what counts (design spec → Food Diary §5). */
export const MonthStatsTiles = ({ stats }: MonthStatsTilesProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().diary;
  const streak = stats?.streak ?? ValueConstants.zero;
  const tiles = [
    {
      key: 'average',
      label: strings.statAverage,
      value:
        stats === null || stats.dailyAverage === null
          ? CharConstants.emDash
          : `${formatWholeNumber(stats.dailyAverage, locale)} ${t().nutrition.kcal}`,
    },
    {
      key: 'target',
      label: strings.statOnTarget,
      value: stats === null || stats.daysLogged === ValueConstants.zero ? CharConstants.emDash : `${stats.daysOnTarget} / ${stats.daysLogged}`,
    },
    {
      key: 'streak',
      label: strings.statStreak,
      value: streak === ValueConstants.one ? strings.streakOne : strings.streakOther.replace('{n}', String(streak)),
    },
  ];
  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        {tiles.map((tile) => (
          <View key={tile.key} accessible style={[styles.tile, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <SizedText size={fontSizes.small} muted ratio={lineHeights.normal} numberOfLines={ValueConstants.two} style={styles.label}>
              {tile.label}
            </SizedText>
            <SizedText size={fontSizes.subheading} weight={fontWeights.heavy}>
              {tile.value}
            </SizedText>
          </View>
        ))}
      </View>
      <SizedText size={fontSizes.small} muted ratio={lineHeights.normal}>
        {strings.statsFootnote}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: ValueConstants.one,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  label: { minHeight: fontSizes.small * lineHeights.normal * ValueConstants.two },
});
