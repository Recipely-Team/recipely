import { Pressable, StyleSheet, View } from 'react-native';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalorieStatus, type CalorieStatusType } from '@domain/diary/nutrition/calorie-status';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useDiaryTones } from '@presentation/base/theme/colors/tones/use-diary-tones';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, colorAlphas, diarySizes, fontSizes, fontWeights, opacities, spacing, BrandColors } from '@presentation/base/theme';
import { StatusMarker } from '@presentation/app/diary/shared/items/status-marker';
import { statusMarkerFor } from '@presentation/app/diary/shared/model/status-marker-for';
import { dayA11yLabel } from '@presentation/app/diary/shared/model/day-a11y-label';
import { useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface MonthCellProps {
  date: CalendarDate;
  status: CalorieStatusType;
  calories: number;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
  height: number;
  onPress: (date: CalendarDate) => void;
}

/**
 * One day of the month grid: the day number in its status ink on the status
 * fill, with the status marker beneath (design spec → Food Diary §5). Today
 * is underlined, the selected day outlined, future days dimmed and inert.
 */
export const MonthCell = ({ date, status, calories, isToday, isSelected, isFuture, height, onPress }: MonthCellProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const tones = useDiaryTones();
  const locale = useLocale();
  const tone = status === CalorieStatus.None ? null : tones[status];
  const ink = tone?.fg ?? colors.text;
  const marker = statusMarkerFor(status);
  return (
    <Pressable
      onPress={() => onPress(date)}
      disabled={isFuture}
      accessibilityRole="button"
      accessibilityLabel={dayA11yLabel(date, calories, status, locale)}
      accessibilityState={{ selected: isSelected, disabled: isFuture }}
      style={[
        styles.cell,
        {
          minHeight: height,
          backgroundColor: tone?.bg ?? BrandColors.transparent,
          borderColor: tone === null ? colors.cardBorder : tone.fg + colorAlphas.light,
          opacity: isFuture ? opacities.disabledStrong : opacities.full,
        },
        isSelected ? { borderColor: colors.text, borderWidth: borderWidths.medium } : null,
      ]}
    >
      <View style={[styles.number, isToday ? { borderBottomColor: ink } : null]}>
        <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={ink}>
          {String(date.day)}
        </SizedText>
      </View>
      {marker === null ? <View style={styles.markerSpace} /> : <StatusMarker kind={marker} color={ink} size={diarySizes.marker} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cell: {
    flex: ValueConstants.one,
    borderRadius: diarySizes.monthCellRadius,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  number: {
    borderBottomWidth: diarySizes.todayUnderline,
    borderBottomColor: BrandColors.transparent,
  },
  markerSpace: {
    height: diarySizes.marker,
  },
});
