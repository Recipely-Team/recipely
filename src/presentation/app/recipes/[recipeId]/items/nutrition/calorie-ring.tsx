import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { fontSizes, fontWeights, letterSpacings, lineHeights, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';
import { formatNutritionNumber } from '@presentation/app/recipes/[recipeId]/model/nutrition/format-nutrition-number';
import { nutritionPanelSizes } from '@presentation/app/recipes/[recipeId]/model/nutrition/nutrition-panel-sizes';

export interface CalorieRingProps {
  /** Calories on the current basis; `undefined` draws an em dash, never a 0. */
  calories: number | undefined;
  compact: boolean;
}

/**
 * The primary-coloured ring with the calorie figure and "kcal" at its centre.
 *
 * @remarks
 * - **A full ring, as drawn.** The prototype's progress circle has no offset —
 *   calories have no daily target on this screen — so the track only shows at
 *   anti-aliased edges. Both circles are kept so a future target is a
 *   one-prop change.
 */
export const CalorieRing = ({ calories, compact }: CalorieRingProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const size = compact ? nutritionPanelSizes.ringCompact : nutritionPanelSizes.ring;
  const stroke = compact ? nutritionPanelSizes.ringStrokeCompact : nutritionPanelSizes.ringStroke;
  const valueSize = compact ? fontSizes.subheading : fontSizes.display;
  const valueLineHeight = useTextLineHeight(valueSize, lineHeights.solid);
  const unitLineHeight = useTextLineHeight(fontSizes.tiny, lineHeights.snug);
  const center = size / ValueConstants.two;
  const radius = (size - stroke) / ValueConstants.two;

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={center} cy={center} r={radius} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <Circle cx={center} cy={center} r={radius} stroke={colors.primary} strokeWidth={stroke} fill="none" />
      </Svg>
      <ThemedText style={[styles.value, { fontSize: valueSize, lineHeight: valueLineHeight, color: colors.text }]}>
        {calories === undefined ? CharConstants.emDash : formatNutritionNumber(calories, locale)}
      </ThemedText>
      <ThemedText muted style={[styles.unit, { lineHeight: unitLineHeight }]}>
        {t().nutrition.kcal}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: fontWeights.heavy,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
    marginTop: spacing.xxs,
  },
});
