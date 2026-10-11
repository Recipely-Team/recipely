import { StyleSheet, View } from 'react-native';
import { FridgeDiet } from '@domain/fridge/ideas/fridge-diet';
import { FridgeMaxMinutes } from '@domain/fridge/ideas/fridge-max-minutes';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { SegmentedTabs } from '@presentation/base/widgets/diary/segmented-tabs';
import type { SegmentOption } from '@presentation/base/widgets/diary/segment-option';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ChoiceChip } from '@presentation/app/fridge/items/ingredients/choice-chip';
import { ServingsStepper } from '@presentation/app/fridge/items/ingredients/servings-stepper';
import type { FridgeFilters } from '@presentation/app/fridge/model/filters/fridge-filters';
import { MaxTimeKey } from '@presentation/app/fridge/model/filters/max-time-key';
import { dietLabel } from '@presentation/app/fridge/model/filters/diet-label';
import { CharConstants } from '@core/constants';

export interface FiltersCardProps {
  filters: FridgeFilters;
  onChange: (filters: Partial<FridgeFilters>) => void;
}

/** "Filters · optional": max time (Any / 15 / 30 / 60), one diet, and servings. */
export const FiltersCard = ({ filters, onChange }: FiltersCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().fridge;
  const timeOptions: SegmentOption<string>[] = [
    { key: MaxTimeKey.Any, label: copy.anyTime },
    ...Object.values(FridgeMaxMinutes).map((minutes) => ({ key: MaxTimeKey.of(minutes), label: copy.minutes.replace('{n}', String(minutes)) })),
  ];
  const label = (text: string) => (
    <SizedText size={fontSizes.caption} weight={fontWeights.bold} muted>
      {text}
    </SizedText>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <SizedText accessibilityRole="header" size={fontSizes.medium} weight={fontWeights.bold}>
        {copy.filtersTitle + CharConstants.middotSpaced}
        <SizedText size={fontSizes.medium} weight={fontWeights.regular} muted>
          {copy.filtersOptional}
        </SizedText>
      </SizedText>
      {label(copy.maxTime)}
      <SegmentedTabs options={timeOptions} value={MaxTimeKey.of(filters.maxMinutes)} onChange={(key) => onChange({ maxMinutes: MaxTimeKey.toMinutes(key) })} />
      {label(copy.diet)}
      <View accessibilityRole="radiogroup" style={styles.chips}>
        {Object.values(FridgeDiet).map((diet) => (
          <ChoiceChip key={diet} label={dietLabel(diet)} selected={filters.diet === diet} onPress={() => onChange({ diet })} />
        ))}
      </View>
      <View style={styles.servings}>
        {label(copy.servings)}
        <ServingsStepper value={filters.servings} onChange={(servings) => onChange({ servings })} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    padding: spacing.lg,
    gap: spacing.sm2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  servings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});
