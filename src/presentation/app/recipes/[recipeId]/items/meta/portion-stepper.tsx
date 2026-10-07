import { StyleSheet, View } from 'react-native';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { controlSizes, fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { PortionScaling } from '@presentation/app/recipes/[recipeId]/model/portions/portion-scaling';

export interface PortionStepperProps {
  portions: PortionScaling;
  /**
   * Inside the mobile servings stat tile: the tile already prints the count, and
   * a quarter-width tile only fits the smaller icon buttons (still past the 24pt minimum).
   */
  inTile?: boolean;
}

/**
 * − 4 + — the recipe detail's servings stepper, built from the same
 * `RoundIconButton` the diary's servings stepper uses. Every ingredient amount
 * on the page follows it.
 */
export const PortionStepper = ({ portions, inTile = false }: PortionStepperProps): React.JSX.Element => {
  const strings = t().recipes.portions;
  const size = inTile ? controlSizes.iconBtnSm : controlSizes.touchTarget;
  return (
    <View style={styles.row}>
      <RoundIconButton
        icon="remove"
        accessibilityLabel={strings.decrease}
        onPress={portions.onDecrement}
        size={size}
        disabled={!portions.canDecrement}
      />
      {inTile ? null : (
        <SizedText size={fontSizes.subtitle} weight={fontWeights.bold} accessibilityLiveRegion="polite">
          {String(portions.servings)}
        </SizedText>
      )}
      <RoundIconButton
        icon="add"
        accessibilityLabel={strings.increase}
        onPress={portions.onIncrement}
        size={size}
        disabled={!portions.canIncrement}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
});
