import { StyleSheet, View } from 'react-native';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { controlSizes, fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';

export interface MealLogBackRowProps {
  onBack: () => void;
}

/**
 * **MealLogBackRow** — stands in for the pick step's tabs while the meal panel
 * is open: a back button to the tabs and the panel's name as its heading.
 *
 * @remarks
 * - The tabs used to stay on screen with none selected, and "Start over" was
 *   the only way out of the panel.
 */
export const MealLogBackRow = ({ onBack }: MealLogBackRowProps): React.JSX.Element => (
  <View style={styles.row}>
    <RoundIconButton
      icon="chevron-back"
      accessibilityLabel={t().common.back}
      onPress={onBack}
      size={controlSizes.iconBtn}
      padToTouchTarget
    />
    <SizedText size={fontSizes.body} weight={fontWeights.bold} accessibilityRole="header" style={styles.title}>
      {t().diary.mealLogEntry}
    </SizedText>
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { flex: ValueConstants.one },
});
