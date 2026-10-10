import { Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { controlSizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface GradientCtaProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

/**
 * The flow's AI call to action — the same gradient, white label and medium
 * shadow as the create screen's "Generate recipe"; 50% when disabled.
 */
export const GradientCta = ({ label, onPress, icon, disabled = false }: GradientCtaProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[styles.cta, shadows.md, { opacity: disabled ? opacities.disabled : opacities.full }]}
    >
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
        end={{ x: ValueConstants.one, y: ValueConstants.one }}
        style={styles.inner}
      >
        {icon === undefined ? null : <Ionicons name={icon} size={iconSizes.md} color={colors.onOverlay} />}
        <SizedText size={fontSizes.heading} weight={fontWeights.bold} color={colors.onOverlay}>
          {label}
        </SizedText>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cta: {
    minHeight: controlSizes.button,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  inner: {
    flex: ValueConstants.one,
    minHeight: controlSizes.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
