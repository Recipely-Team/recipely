import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useRecipeTimer } from '@presentation/base/hooks/timers/use-recipe-timer';
import { formatTimer } from '@presentation/base/utils/format-timer';
import { spacing, radii, fontSizes, fontWeights, iconSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface InlineTimerProps {
  /** Stable unique key — `${recipeId}:step${stepIndex}:${durationMin}min` */
  timerId: string;
  recipeId: string;
  recipeName: string;
  minutes: number;
}

/** Persistent per-step countdown chip that survives screen navigation and app backgrounding. */
export const InlineTimer = ({
  timerId,
  recipeId,
  recipeName,
  minutes,
}: InlineTimerProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const timer = useRecipeTimer({ timerId, recipeId, recipeName, minutes });

  if (!timer.isActive) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t().timer.start} — ${String(minutes)} ${t().recipes.minutes}`}
        onPress={() => void timer.start()}
        style={[styles.idle, { backgroundColor: colors.chipBackground }]}
      >
        <Ionicons name="time-outline" size={iconSizes.xs} color={colors.primary} />
        <ThemedText variant="caption" style={[styles.idleLabel, { color: colors.primary }]}>
          {String(minutes)} {t().recipes.minutes}
        </ThemedText>
      </Pressable>
    );
  }

  const done = timer.isDone;
  return (
    <View style={[styles.active, { backgroundColor: done ? colors.successLight : colors.primary }]}>
      <ThemedText
        variant="caption"
        style={[styles.activeText, { color: done ? colors.success : colors.primaryText }]}
      >
        {done ? `✓ ${t().timer.done}` : formatTimer(timer.remainingSeconds)}
      </ThemedText>
      {!done ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={timer.isPaused ? 'Resume timer' : 'Pause timer'}
          onPress={() => void (timer.isPaused ? timer.resume() : timer.pause())}
          style={[styles.activeBtn, { backgroundColor: colors.gradientBorder }]}
        >
          <Ionicons name={timer.isPaused ? 'play' : 'pause'} size={iconSizes.xxs} color={colors.primaryText} />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Stop timer"
        onPress={() => void timer.stop()}
        style={[styles.activeBtn, { backgroundColor: colors.gradientBorder }]}
      >
        <Ionicons name="close" size={iconSizes.xs} color={done ? colors.success : colors.primaryText} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  idle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.round,
    alignSelf: 'flex-start',
  },
  idleLabel: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.small,
  },
  active: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.sm2,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.round,
    alignSelf: 'flex-start',
  },
  activeText: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.small,
    fontVariant: ['tabular-nums'],
  },
  activeBtn: {
    width: iconSizes.lg,
    height: iconSizes.lg,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
