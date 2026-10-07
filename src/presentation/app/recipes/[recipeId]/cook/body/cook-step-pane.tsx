import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { useHorizontalSwipe } from '@presentation/base/hooks/interaction/use-horizontal-swipe';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontWeights, iconSizes, lineHeightFor, lineHeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { CookStepTimer } from '@presentation/app/recipes/[recipeId]/cook/items/cook-step-timer';
import { CookCopyToken } from '@presentation/app/recipes/[recipeId]/cook/model/cook-copy-token';
import { cookModeSizes } from '@presentation/app/recipes/[recipeId]/cook/model/cook-mode-sizes';

export interface CookStepPaneProps {
  recipeId: string;
  recipeName: string;
  step: string;
  /** Zero-based. */
  index: number;
  total: number;
  isDone: boolean;
  onToggleDone: () => void;
  /** Minutes the step names, or `null` for no timer. */
  minutes: number | null;
  /** +1 forward, -1 back. */
  onSwipe: (direction: number) => void;
}

/**
 * One step, large: "Step 3 of 8", a done tick, the text, and its timer.
 *
 * Swiping the pane sideways pages the steps; the text scrolls vertically
 * when a long step outgrows the screen at a large font scale.
 */
export const CookStepPane = (props: CookStepPaneProps): React.JSX.Element => {
  const { recipeId, recipeName, step, index, total, isDone, onToggleDone, minutes, onSwipe } = props;
  const colors = useTheme().colors;
  const scrollable = useAssistantScrollable();
  const swipe = useHorizontalSwipe(onSwipe, cookModeSizes.swipeThreshold);
  const stepLabel = t()
    .cookMode.stepOf.replace(CookCopyToken.step, String(index + ValueConstants.one))
    .replace(CookCopyToken.total, String(total));

  return (
    <View style={styles.pane} accessibilityHint={t().cookMode.swipeHint} {...swipe}>
      <View style={styles.header}>
        <ThemedText variant="label" accessibilityRole="header" style={[styles.stepLabel, { color: colors.primary }]}>
          {stepLabel}
        </ThemedText>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isDone }}
          accessibilityLabel={isDone ? t().cookMode.markUndone : t().cookMode.markDone}
          onPress={onToggleDone}
          style={[
            styles.done,
            isDone
              ? { backgroundColor: colors.success, borderColor: colors.success }
              : { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons name="checkmark" size={iconSizes.md} color={isDone ? colors.onSuccess : colors.textMuted} />
          <ThemedText variant="label" style={[styles.doneLabel, { color: isDone ? colors.onSuccess : colors.textMuted }]}>
            {t().cookMode.stepDone}
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView {...scrollable} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* One plain string child: element children can drop out on a native re-measure. */}
        <ThemedText style={[styles.stepText, { color: colors.text }]}>{step}</ThemedText>
        {minutes !== null ? (
          <CookStepTimer recipeId={recipeId} recipeName={recipeName} stepIndex={index} minutes={minutes} />
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  pane: {
    flex: ValueConstants.one,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  stepLabel: {
    fontWeight: fontWeights.bold,
  },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: controlSizes.iconBtn,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  doneLabel: {
    fontWeight: fontWeights.semibold,
  },
  scroll: {
    flex: ValueConstants.one,
  },
  scrollContent: {
    gap: spacing.xl,
    paddingBottom: spacing.lg,
  },
  stepText: {
    fontSize: cookModeSizes.stepFontSize,
    lineHeight: lineHeightFor(cookModeSizes.stepFontSize, lineHeights.relaxed),
    fontWeight: fontWeights.medium,
  },
});
