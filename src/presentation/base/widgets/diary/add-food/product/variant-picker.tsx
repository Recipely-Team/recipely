import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { SegmentedTabs } from '@presentation/base/widgets/diary/segmented-tabs';
import type { VariantOption } from '@presentation/base/widgets/diary/add-food/state/product/variant-option';
import { formatPerHundred } from '@presentation/base/utils/diary/units/format-per-hundred';
import { borderWidths, diarySizes, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface VariantPickerProps {
  variants: readonly VariantOption[];
  selected: number;
  baseUnit: string;
  onSelect: (index: number) => void;
}

/**
 * A product's variants (Add food v2 spec §2b): a segmented control for up to
 * four (Klasik / Az yağlı / Az tuzlu), a radio list with each one's kcal per
 * 100 for more (bread's five).
 */
export const VariantPicker = ({ variants, selected, baseUnit, onSelect }: VariantPickerProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  if (variants.length <= diarySizes.variantSegmentsMax) {
    return (
      <SegmentedTabs
        options={variants.map((variant) => ({ key: variant.key, label: variant.name }))}
        value={variants[selected]?.key ?? variants[ValueConstants.zero]?.key ?? String(selected)}
        onChange={(key) => onSelect(Math.max(ValueConstants.zero, variants.findIndex((variant) => variant.key === key)))}
      />
    );
  }
  return (
    <View accessibilityRole="radiogroup" style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      {variants.map((variant, index) => {
        const isSelected = index === selected;
        return (
          <Pressable
            key={variant.key}
            onPress={() => onSelect(index)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            style={[styles.row, index > ValueConstants.zero ? { borderTopColor: colors.cardBorder, borderTopWidth: borderWidths.hairline } : null]}
          >
            <View style={[styles.ring, { borderColor: isSelected ? colors.primary : colors.border }]}>
              {isSelected ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
            </View>
            <SizedText size={fontSizes.medium} weight={isSelected ? fontWeights.bold : fontWeights.regular} style={styles.name}>
              {variant.name}
            </SizedText>
            <SizedText size={fontSizes.small} muted>
              {formatPerHundred(variant.per100, baseUnit, locale)}
            </SizedText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  list: { borderRadius: radii.lg, borderWidth: borderWidths.hairline, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: diarySizes.variantRowMinHeight,
    paddingHorizontal: spacing.md,
  },
  ring: {
    width: diarySizes.radioOuter,
    height: diarySizes.radioOuter,
    borderRadius: radii.round,
    borderWidth: diarySizes.radioRing,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: diarySizes.radioDot, height: diarySizes.radioDot, borderRadius: radii.round },
  name: { flex: ValueConstants.one },
});
