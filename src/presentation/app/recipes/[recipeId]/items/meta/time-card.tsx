import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ControlButton } from '@presentation/app/recipes/[recipeId]/items/control-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useRecipeTimer } from '@presentation/base/hooks/timers/use-recipe-timer';
import { formatTimer } from '@presentation/base/utils/format-timer';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface TimeCardProps {
  label: string;
  minutes: number;
  recipeId: string;
  recipeName: string;
}

/**
 * A recipe has exactly one timer, on its cook time, so the id needs no slot to
 * disambiguate. Prep time renders as a plain stat — see `recipe-meta-card`.
 */
const COOK_TIMER_SLOT = 'cook';

/**
 * The recipe's cook-time countdown, rendered as one segment of the meta card.
 * The timer is backed by the persistent `timerStore`, so it keeps running
 * across screen navigation and app backgrounding, and surfaces in system
 * notifications. Prep time has no timer — see `recipe-meta-card`.
 */
export const TimeCard = ({
  label,
  minutes,
  recipeId,
  recipeName,
}: TimeCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const timer = useRecipeTimer({
    timerId: `${recipeId}:${COOK_TIMER_SLOT}`,
    recipeId,
    recipeName,
    minutes,
  });

  const { isActive, isPaused, isDone, remainingSeconds } = timer;
  const iconBg = isDone ? colors.successLight : colors.chipBackground;
  const iconTint = isDone ? colors.success : colors.primary;

  const valueText = isDone
    ? t().timer.done
    : isActive
      ? formatTimer(remainingSeconds)
      : `${String(minutes)} ${t().recipes.minutes}`;

  const controls = (
    <View style={styles.controls}>
      {!isActive ? (
        <ControlButton
          icon="play"
          bg={colors.primary}
          iconColor={colors.onOverlay}
          label={t().timer.start}
          onPress={() => void timer.start()}
          disabled={minutes <= ValueConstants.zero}
        />
      ) : isDone ? (
        <ControlButton
          icon="checkmark-done"
          bg={colors.successLight}
          iconColor={colors.success}
          label={t().timer.done}
          onPress={() => void timer.stop()}
        />
      ) : (
        <>
          <ControlButton
            icon={isPaused ? 'play' : 'pause'}
            bg={isPaused ? colors.primary : colors.warning}
            iconColor={colors.onOverlay}
            label={t().timer.start}
            onPress={() => void (isPaused ? timer.resume() : timer.pause())}
          />
          <ControlButton
            icon="close"
            bg={colors.chipBackground}
            iconColor={colors.textMuted}
            label={t().common.cancel}
            onPress={() => void timer.stop()}
          />
        </>
      )}
    </View>
  );

  return (
    <View style={styles.segment}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={isDone ? 'checkmark' : 'flame-outline'} size={iconSizes.lg} color={iconTint} />
      </View>
      <ThemedText
        style={[styles.value, { color: isDone ? colors.success : colors.text }]}
        numberOfLines={1}
      >
        {valueText}
      </ThemedText>
      <ThemedText variant="label" muted style={styles.segmentLabel} numberOfLines={1}>
        {label}
      </ThemedText>
      {controls}
    </View>
  );
};

const styles = StyleSheet.create({
  segment: {
    flex: ValueConstants.one,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  segmentLabel: {
    fontSize: fontSizes.micro,
    textAlign: 'center',
  },
  iconWrap: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    // WHY: kept static (never toggled to undefined) — React Native sends `null`
    // to the native side when clearing fontVariant, and processFontVariant
    // crashes on null. tabular-nums is harmless on non-digit text.
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
