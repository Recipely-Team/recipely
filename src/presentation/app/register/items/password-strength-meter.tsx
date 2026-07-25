import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { PASSWORD_STRENGTH_SEGMENTS } from '@presentation/app/register/model/password-strength-segments';
import { ValueConstants } from '@core/constants';

export interface PasswordStrengthMeterProps {
  strength: number;
}

/** Four-segment password-strength bar with a label, driven by a 0–4 score. */
export const PasswordStrengthMeter = ({ strength }: PasswordStrengthMeterProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const labels = [t().register.weak, t().register.weak, t().register.fair, t().register.good, t().register.strong];
  const segmentColors = [colors.danger, colors.danger, colors.warning, colors.warning, colors.success];
  const strengthColor = segmentColors[strength];

  return (
    <View style={styles.strengthWrap}>
      <View style={styles.strengthSegments}>
        {Array.from({ length: PASSWORD_STRENGTH_SEGMENTS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.strengthSegment,
              { backgroundColor: i < strength ? strengthColor : colors.border },
            ]}
          />
        ))}
      </View>
      <ThemedText variant="caption" style={{ color: strengthColor, marginTop: spacing.xs }}>
        {labels[strength]}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  strengthWrap: {
    marginBottom: spacing.sm,
  },
  strengthSegments: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  strengthSegment: {
    flex: ValueConstants.one,
    height: spacing.xs,
    borderRadius: radii.xs,
  },
});
