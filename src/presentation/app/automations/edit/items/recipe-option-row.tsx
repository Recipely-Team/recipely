import { Pressable, StyleSheet, View } from 'react-native';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { borderWidths, fontSizes, fontWeights, opacities, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface RecipeOptionRowProps {
  hit: RecipeFoodHit;
  selected: boolean;
  onSelect: (hit: RecipeFoodHit) => void;
}

/**
 * One of the creator's recipes in the picker (spec step 3): thumb, name, kcal,
 * a radio. A recipe that is not published cannot be sent to a stranger, so
 * it shows why and cannot be chosen.
 */
export const RecipeOptionRow = ({ hit, selected, onSelect }: RecipeOptionRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const copy = t().instagram;
  const meta = hit.isDraft ? copy.draftUnavailable : t().diary.perServingMeta.replace('{k}', formatWholeNumber(hit.perServing.calories, locale));
  return (
    <Pressable
      onPress={() => onSelect(hit)}
      disabled={hit.isDraft}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: hit.isDraft }}
      style={[
        styles.row,
        { backgroundColor: selected ? colors.chipBackground : colors.background, opacity: hit.isDraft ? opacities.disabled : opacities.full },
      ]}
    >
      <View style={styles.thumb}>
        <RecipeImage uri={hit.imageUrl} placeholderCompact style={StyleSheet.absoluteFill} />
      </View>
      <View style={styles.text}>
        <SizedText size={fontSizes.medium} weight={fontWeights.bold} numberOfLines={ValueConstants.one}>
          {hit.name}
        </SizedText>
        <SizedText size={fontSizes.small} color={colors.textSubtle} numberOfLines={ValueConstants.one}>
          {meta}
        </SizedText>
      </View>
      <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>
        {selected ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: AutomationMetrics.recipeRow, paddingHorizontal: spacing.sm, borderRadius: radii.lg },
  thumb: { width: AutomationMetrics.recipeThumb, height: AutomationMetrics.recipeThumb, borderRadius: radii.md, overflow: 'hidden' },
  text: { flex: ValueConstants.one, minWidth: ValueConstants.zero, gap: spacing.xxs },
  radio: {
    width: AutomationMetrics.radio,
    height: AutomationMetrics.radio,
    borderRadius: radii.round,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: AutomationMetrics.radio / ValueConstants.two, height: AutomationMetrics.radio / ValueConstants.two, borderRadius: radii.round },
});
