import { Pressable, StyleSheet, View } from 'react-native';
import type { FoodUnit } from '@domain/diary/foods/units/food-unit';
import { isBaseUnitKey } from '@domain/diary/foods/units/is-base-unit-key';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { unitWord } from '@presentation/base/utils/diary/units/unit-word';
import { hasUnitWord } from '@presentation/base/utils/diary/units/has-unit-word';
import { formatFoodPortion } from '@presentation/base/utils/diary/units/format-food-portion';
import { borderWidths, diarySizes, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface UnitChipsProps {
  units: readonly FoodUnit[];
  /** The product's base unit, for "1 bardak · 200 ml"; null when only a logged unit is known. */
  baseUnit: string | null;
  selected: string;
  onSelect: (unit: FoodUnit) => void;
}

/** The amount's units as wrapping radio chips: serving units ("1 bardak · 200 ml") first, then "ml" / "g". */
export const UnitChips = ({ units, baseUnit, selected, onSelect }: UnitChipsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const { isWebShell } = useLayout();
  const label = (unit: FoodUnit): string => {
    if (isBaseUnitKey(unit.key) || baseUnit === null) return unitWord(unit.key, ValueConstants.zero);
    const inBase = formatFoodPortion({ key: baseUnit, amount: ValueConstants.one }, unit.amount, baseUnit, locale);
    // A unit the app has no word for yet is offered as its amount: "300 ml".
    return hasUnitWord(unit.key) ? t().diary.unitChip.replace('{u}', unitWord(unit.key, ValueConstants.one)).replace('{a}', inBase) : inBase;
  };
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {units.map((unit) => {
        const isSelected = unit.key === selected;
        return (
          <Pressable
            key={unit.key}
            onPress={() => onSelect(unit)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            style={[
              styles.chip,
              { minHeight: isWebShell ? diarySizes.unitChipMinHeightWeb : diarySizes.unitChipMinHeight },
              isSelected
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            <SizedText
              size={fontSizes.caption}
              weight={isSelected ? fontWeights.bold : fontWeights.semibold}
              color={isSelected ? colors.primaryText : colors.text}
            >
              {label(unit)}
            </SizedText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs2 },
  chip: {
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    justifyContent: 'center',
  },
});
