import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SuffixField } from '@presentation/base/widgets/diary/suffix-field';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { controlSizes, diarySizes, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface GoalMacroRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** "30% of calories" under the label; null for fiber, which has no kcal. */
  share: string | null;
}

/** One gram goal on the Daily goals sheet: label, its share of the calories, and a gram field. */
export const GoalMacroRow = ({ label, value, onChange, share }: GoalMacroRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <View style={styles.text}>
        <SizedText size={fontSizes.body} weight={fontWeights.semibold}>
          {label}
        </SizedText>
        {share === null ? null : (
          <SizedText size={fontSizes.small} muted>
            {share}
          </SizedText>
        )}
      </View>
      <SuffixField value={value} onChangeText={onChange} accessibilityLabel={label} suffix={t().nutrition.g} numeric style={styles.field} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: controlSizes.settingsRow,
    borderRadius: radii.lg,
    paddingVertical: spacing.xs2,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs2,
  },
  text: { flex: ValueConstants.one, gap: spacing.xxs },
  field: { width: diarySizes.goalInputWidth },
});
