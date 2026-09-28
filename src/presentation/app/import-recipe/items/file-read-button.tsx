import { Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface FileReadButtonProps {
  disabled: boolean;
  onPress: () => void;
}

const GRADIENT_START = { x: ValueConstants.zero, y: ValueConstants.zero };
const GRADIENT_END = { x: ValueConstants.one, y: ValueConstants.one };

/** "Read recipe" — the AI call to action, in the same gradient as the create screen's Generate. */
export const FileReadButton = ({ disabled, onPress }: FileReadButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const label = t().fileImport.submit;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, shadows.md, { opacity: disabled ? opacities.disabled : opacities.full }]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={styles.inner}
      >
        <Ionicons name="sparkles" size={iconSizes.lg} color={colors.primaryText} />
        <ThemedText variant="body" style={[styles.label, { color: colors.primaryText }]}>
          {label}
        </ThemedText>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: controlSizes.button,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  inner: {
    flex: ValueConstants.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.heading,
  },
});
