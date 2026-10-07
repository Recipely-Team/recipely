import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface CookControlsProps {
  isFirst: boolean;
  isLast: boolean;
  onPrevious: () => void;
  /** Ticks the step and moves on; on the last step it finishes. */
  onNext: () => void;
}

/** Previous and Next (Finish on the last step), big enough for a floury thumb. */
export const CookControls = ({ isFirst, isLast, onPrevious, onNext }: CookControlsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const nextLabel = isLast ? t().cookMode.finish : t().cookMode.next;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isFirst }}
        disabled={isFirst}
        onPress={onPrevious}
        style={({ pressed }) => [
          styles.button,
          styles.previous,
          {
            borderColor: colors.cardBorder,
            backgroundColor: colors.surface,
            opacity: isFirst ? opacities.disabled : pressed ? opacities.pressed : opacities.full,
          },
        ]}
      >
        <Ionicons name="chevron-back" size={iconSizes.lg} color={colors.text} />
        <ThemedText variant="subtitle" numberOfLines={ValueConstants.one} style={[styles.label, { color: colors.text }]}>
          {t().cookMode.previous}
        </ThemedText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onNext}
        style={({ pressed }) => [
          styles.button,
          styles.next,
          { backgroundColor: isLast ? colors.success : colors.primary, opacity: pressed ? opacities.pressed : opacities.full },
        ]}
      >
        <ThemedText
          variant="subtitle"
          numberOfLines={ValueConstants.one}
          style={[styles.label, { color: isLast ? colors.onSuccess : colors.primaryText }]}
        >
          {nextLabel}
        </ThemedText>
        <Ionicons name={isLast ? 'checkmark' : 'chevron-forward'} size={iconSizes.lg} color={isLast ? colors.onSuccess : colors.primaryText} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: controlSizes.fab,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xl,
  },
  previous: {
    flex: ValueConstants.one,
    borderWidth: borderWidths.hairline,
  },
  next: {
    flex: ValueConstants.two,
  },
  label: {
    flexShrink: ValueConstants.one,
    fontWeight: fontWeights.bold,
  },
});
