import { Pressable, StyleSheet, View } from 'react-native';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWeekRange } from '@presentation/base/utils/meal-plan/format-week-range';
import { borderWidths, controlSizes, fontSizes, fontWeights, mealPlanSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface PlanWeekBarProps {
  weekStart: CalendarDate;
  isCurrentWeek: boolean;
  /** "16 meals · avg 1,850 kcal a day" — the web bar's middle; absent on a phone. */
  summary: string | null;
  wide: boolean;
  onPage: (direction: number) => void;
  onThisWeek: () => void;
  onMenu: () => void;
}

/**
 * The week bar (design spec → Meal planner, Week bar): the range, a "This
 * week" chip (an outline button back to this week when another is shown),
 * ‹ › paging and the ⋯ week menu. A plain row on a phone, a card on the web
 * with the week's summary in the middle.
 */
export const PlanWeekBar = ({ weekStart, isCurrentWeek, summary, wide, onPage, onThisWeek, onMenu }: PlanWeekBarProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().mealPlan;
  const arrow = (icon: 'chevron-back' | 'chevron-forward', direction: number, label: string): React.JSX.Element => (
    <RoundIconButton icon={icon} accessibilityLabel={label} onPress={() => onPage(direction)} size={controlSizes.iconBtnSm} padToTouchTarget />
  );
  const range = (
    <SizedText size={wide ? mealPlanSizes.weekRangeWeb : mealPlanSizes.weekRange} weight={fontWeights.heavy} accessibilityRole="header">
      {formatWeekRange(weekStart, locale)}
    </SizedText>
  );
  const chip = isCurrentWeek ? (
    <View style={[styles.chip, { backgroundColor: colors.chipBackground }]}>
      <SizedText size={fontSizes.small} weight={fontWeights.bold} color={colors.chipText}>
        {strings.thisWeek}
      </SizedText>
    </View>
  ) : (
    <Pressable
      onPress={onThisWeek}
      accessibilityRole="button"
      style={({ pressed }) => [styles.outline, { borderColor: colors.cardBorder, opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
    >
      <SizedText size={fontSizes.small} weight={fontWeights.bold}>
        {strings.thisWeek}
      </SizedText>
    </Pressable>
  );
  const menu = (
    <RoundIconButton icon="ellipsis-horizontal" accessibilityLabel={strings.weekOptions} onPress={onMenu} size={controlSizes.iconBtnSm} padToTouchTarget />
  );

  if (!wide) {
    return (
      <View style={styles.row}>
        <View style={styles.grow}>{range}</View>
        {chip}
        {arrow('chevron-back', ValueConstants.minusOne, strings.previousWeek)}
        {arrow('chevron-forward', ValueConstants.one, strings.nextWeek)}
        {menu}
      </View>
    );
  }
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      {arrow('chevron-back', ValueConstants.minusOne, strings.previousWeek)}
      {range}
      {arrow('chevron-forward', ValueConstants.one, strings.nextWeek)}
      {chip}
      <SizedText size={fontSizes.caption} color={colors.textMuted} style={styles.summary} numberOfLines={ValueConstants.one}>
        {summary ?? CharConstants.empty}
      </SizedText>
      {menu}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  grow: { flex: ValueConstants.one },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
  chip: { minHeight: mealPlanSizes.thisWeekChip, paddingHorizontal: spacing.sm, borderRadius: radii.round, justifyContent: 'center' },
  outline: {
    minHeight: controlSizes.touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    justifyContent: 'center',
  },
  summary: { flex: ValueConstants.one, textAlign: 'right' },
});
