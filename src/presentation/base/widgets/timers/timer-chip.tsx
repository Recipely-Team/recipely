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
          numberOfLines={1}
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
            accessibilityLabel={isPaused ? 'Resume timer' : 'Pause timer'}
            onPress={() => void (isPaused ? timer.resume() : timer.pause())}
            style={[styles.actionBtn, { backgroundColor: colors.chipBackground }]}
          >
            <Ionicons name={isPaused ? 'play' : 'pause'} size={11} color={colors.primary} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Stop timer"
          onPress={() => void timer.stop()}
          style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
        >
          <Ionicons name="close" size={12} color={colors.danger} />
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
    gap: spacing.xxs,
  },
  actionBtn: {
    width: iconSizes.lg,
    height: iconSizes.lg,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
