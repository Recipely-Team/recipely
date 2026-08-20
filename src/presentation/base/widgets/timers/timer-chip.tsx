import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useRecipeTimer } from '@presentation/base/hooks/timers/use-recipe-timer';
import { formatTimer } from '@presentation/base/utils/format-timer';
import type { TimerEntry } from '@application/timers/timer-entry';
import { spacing, radii, fontSizes, fontWeights, lineHeights, lineHeightFor, iconSizes, controlSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { RoutePaths } from '@presentation/base/constants';
import { ValueConstants } from '@core/constants';

interface TimerChipProps {
  entry: TimerEntry;
}

/**
 * Padding around the pause / stop buttons. Their 36pt box plus 4pt on each
 * side clears the 44pt minimum touch target, and 4pt is exactly half the gap
 * between them, so the two areas meet without ever overlapping — an overlap
 * here would let a miss on "pause" register as "stop" and kill the timer.
 */
const ACTION_HIT_SLOP = spacing.xs;

export const TimerChip = ({ entry }: TimerChipProps): React.JSX.Element => {
  const { colors } = useTheme();
  const router = useRouter();
  const timer = useRecipeTimer({
    timerId: entry.id,
    recipeId: entry.recipeId,
    recipeName: entry.recipeName,
    minutes: entry.durationSeconds / 60,
  });

  const { remainingSeconds, isPaused, isDone } = timer;

  const handleTap = useCallback(() => {
    router.push(RoutePaths.recipeDetail(entry.recipeId) as Href);
  }, [entry.recipeId, router]);

  const timeLabel = isDone
    ? `✓ ${t().timer.done}`
    : isPaused
      ? `⏸ ${formatTimer(remainingSeconds)}`
      : formatTimer(remainingSeconds);

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: isDone ? colors.successLight : colors.surface,
          borderColor: isDone ? colors.success : colors.border,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${entry.recipeName} — ${timeLabel}`}
        onPress={handleTap}
        style={styles.chipLeft}
      >
        <ThemedText
          style={[styles.chipName, { color: isDone ? colors.success : colors.text }]}
          numberOfLines={ValueConstants.one}
        >
          {entry.recipeName}
        </ThemedText>
        <ThemedText
          style={[
            styles.chipTime,
            { color: isDone ? colors.success : colors.primary },
          ]}
        >
          {timeLabel}
        </ThemedText>
      </Pressable>
      <View style={styles.chipActions}>
        {!isDone ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPaused ? t().timer.resume : t().timer.pause}
            onPress={() => void (isPaused ? timer.resume() : timer.pause())}
            hitSlop={ACTION_HIT_SLOP}
            style={[styles.actionBtn, { backgroundColor: colors.chipBackground }]}
          >
            <Ionicons name={isPaused ? 'play' : 'pause'} size={iconSizes.md} color={colors.primary} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t().timer.stop}
          onPress={() => void timer.stop()}
          hitSlop={ACTION_HIT_SLOP}
          style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
        >
          <Ionicons name="close" size={iconSizes.md} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm2,
    paddingRight: spacing.xs,
    gap: spacing.xs,
    minWidth: controlSizes.timerChipMinWidth,
    maxWidth: controlSizes.timerChipMaxWidth,
  },
  chipLeft: {
    flex: ValueConstants.one,
  },
  chipName: {
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeightFor(fontSizes.micro, lineHeights.snug),
  },
  chipTime: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeightFor(fontSizes.small, lineHeights.snug),
    fontVariant: ['tabular-nums'],
  },
  chipActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // A round button is a shape, so a pinned size is correct here — it holds a
  // glyph, never text. Was an 18pt box with an 11pt glyph, which testers could
  // not reliably hit; `controlSizes.iconBtn` + hit slop is a real target.
  actionBtn: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
