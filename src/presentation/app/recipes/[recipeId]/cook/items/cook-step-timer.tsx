import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { RoundIconButtonTone } from '@presentation/base/widgets/buttons/round-icon-button-tone';
import { useRecipeTimer } from '@presentation/base/hooks/timers/use-recipe-timer';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { formatTimer } from '@presentation/base/utils/format-timer';
import { t } from '@presentation/i18n';
import { cookStepTimerId } from '@presentation/app/recipes/[recipeId]/cook/model/cook-step-timer-id';
import { CookCopyToken } from '@presentation/app/recipes/[recipeId]/cook/model/cook-copy-token';

export interface CookStepTimerProps {
  recipeId: string;
  recipeName: string;
  stepIndex: number;
  minutes: number;
}

/**
 * The countdown a step names ("simmer 10 minutes"): a start button, then the
 * running time with pause / resume and stop.
 *
 * The app's persistent recipe timer (`useRecipeTimer`), so it keeps counting
 * off this screen, alarms when done and shows in the app-wide timers bar.
 */
export const CookStepTimer = ({ recipeId, recipeName, stepIndex, minutes }: CookStepTimerProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const timer = useRecipeTimer({ timerId: cookStepTimerId(recipeId, stepIndex, minutes), recipeId, recipeName, minutes });

  if (!timer.isActive) {
    const label = t().cookMode.startTimer.replace(CookCopyToken.minutes, String(minutes));
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => void timer.start()}
        style={({ pressed }) => [
          styles.start,
          { borderColor: colors.primary, opacity: pressed ? opacities.pressed : opacities.full },
        ]}
      >
        <Ionicons name="timer-outline" size={iconSizes.lg} color={colors.primary} />
        <ThemedText variant="body" style={[styles.startLabel, { color: colors.primary }]}>
          {label}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <View style={[styles.running, { backgroundColor: timer.isDone ? colors.successLight : colors.surface, borderColor: colors.cardBorder }]}>
      <Ionicons name="timer-outline" size={iconSizes.lg} color={timer.isDone ? colors.success : colors.text} />
      <ThemedText variant="title" accessibilityRole="timer" style={[styles.time, { color: colors.text }]}>
        {timer.isDone ? t().timer.done : formatTimer(timer.remainingSeconds)}
      </ThemedText>
      {timer.isDone ? null : (
        <RoundIconButton
          icon={timer.isPaused ? 'play' : 'pause'}
          accessibilityLabel={timer.isPaused ? t().timer.resume : t().timer.pause}
          onPress={() => void (timer.isPaused ? timer.resume() : timer.pause())}
          size={controlSizes.iconBtn}
          tone={RoundIconButtonTone.Outlined}
        />
      )}
      <RoundIconButton
        icon="stop"
        accessibilityLabel={t().timer.stop}
        onPress={() => void timer.stop()}
        size={controlSizes.iconBtn}
        tone={RoundIconButtonTone.Outlined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  start: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    minHeight: controlSizes.buttonSm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
    borderWidth: borderWidths.thin,
  },
  startLabel: {
    fontWeight: fontWeights.semibold,
  },
  running: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.md,
    minHeight: controlSizes.buttonSm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  time: {
    fontWeight: fontWeights.bold,
    fontVariant: ['tabular-nums'],
  },
});
