import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { borderWidths, controlSizes, fontSizes, fontWeights, lineHeights, shadows, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { NutritionBasis, type NutritionBasisType } from '@domain/recipes/nutrition/nutrition-basis';
import { formatNutritionNumber } from '@presentation/app/recipes/[recipeId]/model/nutrition/format-nutrition-number';
import { nutritionPanelSizes } from '@presentation/app/recipes/[recipeId]/model/nutrition/nutrition-panel-sizes';
import { ValueConstants } from '@core/constants';

export interface NutritionBasisSwitchProps {
  /** Whole grams in one serving; names the serving option. */
  weightGrams: number;
  basis: NutritionBasisType;
  onChange: (basis: NutritionBasisType) => void;
}

/**
 * The "100 g | 1 serving (~N g)" segmented switch.
 *
 * @remarks
 * - **A radio group, not two buttons.** Exactly one basis is always on, which
 *   is what a screen reader should announce — "selected, 1 of 2".
 * - **`100 g` never shrinks**; the serving option takes the rest, so a long
 *   translation wraps inside its own pill instead of squeezing the other.
 */
export const NutritionBasisSwitch = ({ weightGrams, basis, onChange }: NutritionBasisSwitchProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().nutrition;
  const locale = useLocale();
  const lineHeight = useTextLineHeight(fontSizes.caption, lineHeights.snug);

  const options = [
    { value: NutritionBasis.Per100g, label: strings.seg100, flex: styles.fixed },
    {
      value: NutritionBasis.PerServing,
      label: strings.segServing.replace('{g}', formatNutritionNumber(weightGrams, locale)),
      flex: styles.grow,
    },
  ];

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={strings.segAria}
      style={[styles.track, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
    >
      {options.map((option) => {
        const checked = option.value === basis;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={[styles.option, option.flex, checked ? [styles.on, { backgroundColor: colors.cardBackground }] : null]}
          >
            <ThemedText
              style={[
                styles.label,
                checked ? styles.labelOn : styles.labelOff,
                { lineHeight, color: checked ? colors.text : colors.textMuted },
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: nutritionPanelSizes.switchInset,
    gap: nutritionPanelSizes.switchInset,
    borderRadius: nutritionPanelSizes.switchRadius,
    borderWidth: borderWidths.hairline,
  },
  option: {
    minHeight: controlSizes.segmentOption,
    paddingVertical: spacing.xs2,
    paddingHorizontal: spacing.md,
    borderRadius: nutritionPanelSizes.optionRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixed: { flexGrow: ValueConstants.zero, flexShrink: ValueConstants.zero },
  grow: { flexGrow: ValueConstants.one, flexShrink: ValueConstants.one },
  on: shadows.sm,
  label: {
    fontSize: fontSizes.caption,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  labelOn: { fontWeight: fontWeights.bold },
  labelOff: { fontWeight: fontWeights.semibold },
});
