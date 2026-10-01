import { StyleSheet, View } from 'react-native';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { controlSizes, diarySizes, fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface AmountStepperProps {
  /** The amount as read, "1,5" / "250". */
  value: string;
  canDecrement: boolean;
  canIncrement: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
}

/** − 1,5 + — a product amount; the step and bounds are `FoodQuantity`'s. The value is announced as it changes. */
export const AmountStepper = ({ value, canDecrement, canIncrement, onIncrement, onDecrement }: AmountStepperProps): React.JSX.Element => {
  const strings = t().diary;
  return (
    <View style={styles.row}>
      <RoundIconButton
        icon="remove"
        accessibilityLabel={strings.decreaseAmount}
        onPress={onDecrement}
        size={controlSizes.touchTarget}
        disabled={!canDecrement}
      />
      <SizedText size={fontSizes.subtitle} weight={fontWeights.heavy} style={styles.value} accessibilityLiveRegion="polite">
        {value}
      </SizedText>
      <RoundIconButton
        icon="add"
        accessibilityLabel={strings.increaseAmount}
        onPress={onIncrement}
        size={controlSizes.touchTarget}
        disabled={!canIncrement}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  value: { minWidth: diarySizes.amountValueMinWidth, textAlign: 'center' },
});
