import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { fontSizes, fontWeights, lineHeights, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import type { NutritionReading } from '@domain/recipes/nutrition/nutrition-reading';
import { NutritionBasis } from '@domain/recipes/nutrition/nutrition-basis';
import { CharConstants, ValueConstants } from '@core/constants';
import { CalorieRing } from '@presentation/app/recipes/[recipeId]/items/nutrition/calorie-ring';
import { calorieCaption } from '@presentation/app/recipes/[recipeId]/model/nutrition/calorie-caption';

export interface CalorieSummaryProps {
  reading: NutritionReading;
  compact: boolean;
}

/** The calorie row: the ring, then "Calories per …" and the serving/total caption beside it. */
export const CalorieSummary = ({ reading, compact }: CalorieSummaryProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().nutrition;
  const locale = useLocale();
  const titleLineHeight = useTextLineHeight(fontSizes.body, lineHeights.snug);
  const captionLineHeight = useTextLineHeight(fontSizes.small, lineHeights.snug);
  const caption = calorieCaption(reading, locale);

  return (
    <View style={[styles.row, compact ? styles.rowCompact : null]}>
      <CalorieRing calories={reading.calories} compact={compact} />
      <View style={styles.text}>
        <ThemedText style={[styles.title, { lineHeight: titleLineHeight, color: colors.text }]}>
          {strings.calories}
          {CharConstants.space}
          <ThemedText muted style={styles.basis}>
            {reading.basis === NutritionBasis.Per100g ? strings.per100 : strings.perServing}
          </ThemedText>
        </ThemedText>
        {caption === undefined ? null : (
          <ThemedText muted style={[styles.caption, { lineHeight: captionLineHeight }]}>
            {caption}
          </ThemedText>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  rowCompact: { gap: spacing.md },
  text: { flex: ValueConstants.one },
  title: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  basis: { fontWeight: fontWeights.medium },
  caption: {
    fontSize: fontSizes.small,
    marginTop: spacing.xs,
  },
});
