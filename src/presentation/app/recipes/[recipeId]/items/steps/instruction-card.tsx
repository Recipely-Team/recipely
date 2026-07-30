import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, lineHeights, lineHeightFor, iconSizes, decorSizes, borderWidths, maxFontScales } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface InstructionCardProps {
  index: number;
  step: string;
  completed: boolean;
  onToggle: () => void;
}

/**
 * Numbered instruction step card with a tap-to-complete badge.
 *
 * Deliberately renders no per-step countdown chip. The step text already states
 * its duration ("35 dakika pişirin"), so a chip beside it repeated the same
 * number as visual noise. Recipe timers live on the meta card's prep/cook
 * times instead (`time-card.tsx`), where the duration is not already spelled
 * out in a sentence.
 */
export const InstructionCard = ({
  index,
  step,
  completed,
  onToggle,
}: InstructionCardProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
      ]}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        style={[
          styles.numberCircle,
          {
            backgroundColor: completed ? colors.success : colors.primary,
          },
        ]}
      >
        {completed ? (
          <Ionicons name="checkmark" size={iconSizes.sm} color={colors.onSuccess} />
        ) : (
          <ThemedText
            variant="caption"
            maxFontSizeMultiplier={maxFontScales.badge}
            style={[styles.numberText, { color: colors.primaryText }]}
          >
            {index + 1}
          </ThemedText>
        )}
      </Pressable>

      <View style={styles.body}>
        <ThemedText
          variant="body"
          style={[
            styles.stepText,
            {
              color: completed ? colors.textMuted : colors.text,
              textDecorationLine: completed ? 'line-through' : 'none',
            },
          ]}
        >
          {/* The step must stay ONE plain string child, never element children:
              feeding Text element children (even Fragments wrapping strings)
              lets the native text layout drop them on a re-measure mid-scroll,
              and the step then renders as blank space at full height. A string
              child cannot do that. */}
          {step}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  numberCircle: {
    width: decorSizes.badgeSm,
    height: decorSizes.badgeSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    // A long step must grow the card downwards, never squeeze the badge into
    // an ellipse to make room for itself.
    flexShrink: ValueConstants.zero,
  },
  numberText: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.caption,
  },
  body: {
    flex: ValueConstants.one,
  },
  stepText: {
    lineHeight: lineHeightFor(fontSizes.body, lineHeights.relaxed),
  },
});
