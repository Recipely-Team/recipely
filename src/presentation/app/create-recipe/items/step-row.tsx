import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AutoGrowTextInput } from '@presentation/base/widgets/inputs/auto-grow-text-input';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, lineHeightFor, iconSizes, controlSizes, decorSizes, borderWidths, maxFontScales } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface StepRowProps {
  index: number;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  removeLabel: string;
}

/** Inline-editable, auto-growing instruction step with a numbered badge. */
export const StepRow = ({
  index,
  value,
  onChange,
  onRemove,
  removeLabel,
}: StepRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: focused ? colors.chipBackground : colors.surface,
          borderColor: focused ? colors.primary : colors.cardBorder,
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
        end={{ x: ValueConstants.one, y: ValueConstants.one }}
        style={styles.badge}
      >
        <ThemedText
          maxFontSizeMultiplier={maxFontScales.badge}
          style={[styles.badgeLabel, { color: colors.primaryText }]}
        >
          {index + 1}
        </ThemedText>
      </LinearGradient>
      <AutoGrowTextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={t().createRecipe.stepPlaceholder}
        placeholderTextColor={colors.textMuted}
        minHeight={controlSizes.iconBtn}
        style={[styles.input, { color: colors.text }]}
      />
      <Pressable
        onPress={onRemove}
        hitSlop={spacing.sm}
        style={styles.removeBtn}
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
      >
        <Ionicons name="close" size={iconSizes.md} color={colors.textMuted} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.sm2,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  badge: {
    width: decorSizes.badgeSm,
    height: decorSizes.badgeSm,
    flexShrink: ValueConstants.zero,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  input: {
    flex: ValueConstants.one,
    fontSize: fontSizes.medium,
    lineHeight: lineHeightFor(fontSizes.medium),
    paddingVertical: spacing.xs,
  },
  removeBtn: {
    width: controlSizes.iconBtnSm,
    height: controlSizes.iconBtnSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
