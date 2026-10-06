import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { DiaryDay } from '@domain/diary/day/diary-day';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { RoundIconButtonTone } from '@presentation/base/widgets/buttons/round-icon-button-tone';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatOneDecimal } from '@presentation/base/utils/diary/format-one-decimal';
import { borderWidths, controlSizes, diarySizes, fontSizes, fontWeights, iconSizes, radii, shadows, spacing } from '@presentation/base/theme';
import { WaterPills } from '@presentation/app/diary/items/water-pills';
import { t, useLocale } from '@presentation/i18n';

export interface WaterCardProps {
  day: DiaryDay;
  onChange: (glasses: number) => void;
}

/** Glasses of water for the day, with − / + (design spec → Food Diary §4). The store applies a tap at once. */
export const WaterCard = ({ day, onChange }: WaterCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().diary;
  const summary = strings.waterSummary
    .replace('{n}', String(day.waterGlasses))
    .replace('{g}', String(day.goals.waterGlasses))
    .replace('{l}', formatOneDecimal(day.waterLiters, locale));
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={[styles.disc, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="water" size={iconSizes.lg} color={colors.chipText} />
      </View>
      <View style={styles.text} accessible>
        <SizedText size={fontSizes.body} weight={fontWeights.bold}>
          {strings.water}
        </SizedText>
        <SizedText size={fontSizes.small} muted>
          {summary}
        </SizedText>
        <WaterPills glasses={day.waterGlasses} goal={day.goals.waterGlasses} />
      </View>
      <RoundIconButton
        icon="remove"
        accessibilityLabel={strings.removeWater}
        onPress={() => onChange(day.waterGlasses - ValueConstants.one)}
        size={controlSizes.touchTarget}
        disabled={!day.canRemoveWater}
      />
      <RoundIconButton
        icon="add"
        accessibilityLabel={strings.addWater}
        onPress={() => onChange(day.waterGlasses + ValueConstants.one)}
        size={controlSizes.touchTarget}
        tone={RoundIconButtonTone.Primary}
        disabled={!day.canAddWater}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    ...shadows.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    paddingLeft: spacing.lg,
  },
  disc: {
    width: diarySizes.waterDisc,
    height: diarySizes.waterDisc,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: ValueConstants.one, gap: spacing.xxs },
});
