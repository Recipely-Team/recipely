import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { InlineTimer } from '@presentation/app/recipes/[recipeId]/items/steps/inline-timer';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, lineHeights, lineHeightFor, iconSizes, decorSizes, borderWidths, maxFontScales } from '@presentation/base/theme';
import { splitStepWithTimers } from '@presentation/app/recipes/[recipeId]/model/ingredients/split-step-with-timers';
import { ValueConstants } from '@core/constants';

export interface InstructionCardProps {
  index: number;
  step: string;
  completed: boolean;
  onToggle: () => void;
  recipeId: string;
  recipeName: string;
}

/** Numbered instruction step card that detects time references and renders inline countdown timers. */
export const InstructionCard = ({
  index,
  step,
  completed,
  onToggle,
  recipeId,
  recipeName,
}: InstructionCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const parts = splitStepWithTimers(step);

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
          {/* The step is passed as ONE plain string, never as element children.
              `parts` exists only to derive the timer chips below: embedding the
              chip (a View) inside Text baseline-misaligns it on native (the
              "crooked 10dk badge" bug), and feeding Text element children (even
              Fragments wrapping strings) lets the native text layout drop them
              on a re-measure mid-scroll — the step then renders as blank space
              at full height. A string child cannot do that. */}
          {step}
        </ThemedText>
        {parts.some((part) => part.kind === 'timer') ? (
          <View style={styles.timerRow}>
            {parts.map((part, i) =>
              part.kind === 'timer' && part.minutes !== undefined ? (
                <InlineTimer
                  key={i}
                  timerId={`${recipeId}:step${String(index)}:${String(Math.round(part.minutes))}min`}
                  recipeId={recipeId}
                  recipeName={recipeName}
                  minutes={part.minutes}
                />
              ) : null,
            )}
          </View>
        ) : null}
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
  timerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
