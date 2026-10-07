import { StyleSheet, View } from 'react-native';
import type { DiaryDay } from '@domain/diary/day/diary-day';
import { CalorieStatus } from '@domain/diary/nutrition/calorie-status';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useDiaryTones } from '@presentation/base/theme/colors/tones/use-diary-tones';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { borderWidths, diarySizes, fontSizes, fontWeights, lineHeights, radii, shadows, spacing } from '@presentation/base/theme';
import { CalorieRing } from '@presentation/app/diary/items/calorie-ring';
import { SummaryStats } from '@presentation/app/diary/items/summary-stats';
import { MacroBars } from '@presentation/app/diary/items/macro-bars';
import { StatusStrip } from '@presentation/app/diary/items/status-strip';
import { statusMarkerFor } from '@presentation/app/diary/shared/model/status-marker-for';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface SummaryCardProps {
  day: DiaryDay;
  /** The web layout: a bigger ring, stats and four stacked bars in one row. */
  wide: boolean;
}

/**
 * The day at a glance (design spec → Food Diary §4): the calorie ring with
 * what is left (or over), eaten / goal / remaining, the status strip once the
 * day is on target or over, and the macros.
 *
 * @remarks
 * - **Over and far over fill the ring in the tone**, whatever the share — the
 *   arc has nowhere further to go, so the colour carries the news.
 */
export const SummaryCard = ({ day, wide }: SummaryCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const tones = useDiaryTones();
  const locale = useLocale();
  const strings = t().diary;
  const status = day.calorieStatus;
  const tone = status === CalorieStatus.None ? null : tones[status];
  const marker = statusMarkerFor(status);
  const isOver = day.overCalories > ValueConstants.zero;
  const pastGoal = status === CalorieStatus.Over || status === CalorieStatus.Far;
  const figure = isOver ? `+${formatWholeNumber(day.overCalories, locale)}` : formatWholeNumber(day.remainingCalories, locale);
  const strip =
    status === CalorieStatus.On
      ? strings.withinGoal
      : pastGoal
        ? strings.overGoal.replace('{n}', formatWholeNumber(day.overCalories, locale))
        : null;

  const ring = (
    <CalorieRing
      progress={pastGoal ? ValueConstants.one : day.calorieProgress}
      color={pastGoal && tone !== null ? tone.solid : colors.primary}
      size={wide ? diarySizes.ringWeb : diarySizes.ringMobile}
      stroke={wide ? diarySizes.ringStrokeWeb : diarySizes.ringStrokeMobile}
    >
      <View accessible style={styles.centre}>
        <SizedText
          size={wide ? fontSizes.headline : diarySizes.ringValueMobile}
          weight={fontWeights.heavy}
          ratio={lineHeights.tight}
          color={isOver && tone !== null ? tone.solid : colors.text}
        >
          {figure}
        </SizedText>
        <SizedText size={fontSizes.small} weight={fontWeights.semibold} muted>
          {isOver ? strings.kcalOver : strings.kcalLeft}
        </SizedText>
      </View>
    </CalorieRing>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={styles.top}>
        {ring}
        <SummaryStats day={day} />
        {wide ? (
          <View style={styles.wideBars}>
            <MacroBars day={day} stacked />
          </View>
        ) : null}
      </View>
      {strip !== null && tone !== null && marker !== null ? <StatusStrip tone={tone} marker={marker} message={strip} /> : null}
      {wide ? null : <MacroBars day={day} stacked={false} />}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    ...shadows.sm,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' },
  centre: { alignItems: 'center' },
  wideBars: { flex: ValueConstants.one, minWidth: diarySizes.summaryStatsMinWidth },
});
