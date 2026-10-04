import { StyleSheet, View } from 'react-native';
import { NutritionSource, type NutritionSourceType } from '@domain/recipes/nutrition/nutrition-source';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { borderWidths, fontSizes, fontWeights, letterSpacings, lineHeights, radii, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';

export interface NutritionSourceNoteProps {
  source: NutritionSourceType | null;
}

/**
 * The nutrition block's last row when the figures come from a database:
 * a "USDA" tag and the sentence naming FoodData Central (design spec §9.3).
 * Nothing for estimated figures.
 */
export const NutritionSourceNote = ({ source }: NutritionSourceNoteProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const lineHeight = useTextLineHeight(fontSizes.small, lineHeights.snug);
  if (source !== NutritionSource.Usda) return null;

  return (
    <View style={styles.row}>
      <View style={[styles.tag, { borderColor: colors.border }]}>
        <ThemedText style={[styles.tagText, { color: colors.textSubtle }]}>{t().nutrition.usdaTag}</ThemedText>
      </View>
      <ThemedText style={[styles.text, { color: colors.textSubtle, lineHeight }]}>{t().nutrition.usdaSource}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: {
    borderWidth: borderWidths.hairline,
    borderRadius: radii.xs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs2,
  },
  tagText: { fontSize: fontSizes.tiny, fontWeight: fontWeights.heavy, letterSpacing: letterSpacings.wide },
  text: { flex: ValueConstants.one, fontSize: fontSizes.small },
});
