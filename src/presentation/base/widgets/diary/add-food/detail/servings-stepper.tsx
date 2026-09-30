import { StyleSheet, View } from 'react-native';
import type { Servings } from '@domain/diary/entry/servings';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatServings } from '@presentation/base/utils/diary/format-servings';
import { controlSizes, fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface ServingsStepperProps {
  servings: Servings;
  onIncrement: () => void;
  onDecrement: () => void;
}

/** − 1.5 servings + — half steps; the bounds and the step are the `Servings` value object's. */
export const ServingsStepper = ({ servings, onIncrement, onDecrement }: ServingsStepperProps): React.JSX.Element => {
  const locale = useLocale();
  const strings = t().diary;
  return (
    <View style={styles.row}>
      <RoundIconButton
        icon="remove"
        accessibilityLabel={strings.decreaseServings}
        onPress={onDecrement}
        size={controlSizes.touchTarget}
        disabled={!servings.canDecrement}
      />
      <SizedText
        size={fontSizes.subtitle}
        weight={fontWeights.bold}
        style={styles.value}
        accessibilityLiveRegion="polite"
      >
        {formatServings(servings.value, locale)}
      </SizedText>
      <RoundIconButton
        icon="add"
        accessibilityLabel={strings.increaseServings}
        onPress={onIncrement}
        size={controlSizes.touchTarget}
        disabled={!servings.canIncrement}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  value: { flex: ValueConstants.one, textAlign: 'center' },
});
