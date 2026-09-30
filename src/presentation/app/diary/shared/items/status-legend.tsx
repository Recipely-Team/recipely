import { StyleSheet, View } from 'react-native';
import { CalorieStatus } from '@domain/diary/nutrition/calorie-status';
import { useDiaryTones } from '@presentation/base/theme/colors/tones/use-diary-tones';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { diarySizes, fontSizes, fontWeights, letterSpacings, radii, spacing } from '@presentation/base/theme';
import { StatusMarker } from '@presentation/app/diary/shared/items/status-marker';
import { statusLabel } from '@presentation/app/diary/shared/model/status-label';
import { statusMarkerFor } from '@presentation/app/diary/shared/model/status-marker-for';
import { upperCase } from '@presentation/i18n/upper-case';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

const TONED = [CalorieStatus.Under, CalorieStatus.On, CalorieStatus.Over, CalorieStatus.Far] as const;

/** "Calories vs goal": each status as its swatch, marker and words, so the calendar's colours are never the only key. */
export const StatusLegend = (): React.JSX.Element => {
  const tones = useDiaryTones();
  return (
    <View style={styles.stack}>
      <SizedText accessibilityRole="header" size={fontSizes.micro} weight={fontWeights.bold} muted style={styles.title}>
        {upperCase(t().diary.legendTitle)}
      </SizedText>
      <View style={styles.grid}>
        {TONED.map((status) => {
          const marker = statusMarkerFor(status);
          return (
            <View key={status} style={styles.item}>
              <View style={[styles.swatch, { backgroundColor: tones[status].bg }]}>
                {marker === null ? null : <StatusMarker kind={marker} color={tones[status].fg} size={diarySizes.marker} />}
              </View>
              <SizedText size={fontSizes.small}>{statusLabel(status)}</SizedText>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  title: { letterSpacing: letterSpacings.wide },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexGrow: ValueConstants.one,
    flexBasis: diarySizes.legendColumnMin,
  },
  swatch: {
    width: diarySizes.legendSwatch,
    height: diarySizes.legendSwatch,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
