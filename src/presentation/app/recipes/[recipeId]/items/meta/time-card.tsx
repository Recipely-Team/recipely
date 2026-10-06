import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatTileText } from '@presentation/app/recipes/[recipeId]/items/meta/stat-tile-text';
import { ControlButton } from '@presentation/app/recipes/[recipeId]/items/control-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useRecipeTimer } from '@presentation/base/hooks/timers/use-recipe-timer';
import { formatTimer } from '@presentation/base/utils/format-timer';
import { spacing, radii, iconSizes, decorSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { cookTimerId } from '@presentation/app/recipes/[recipeId]/model/cook-timer-slot';

export interface TimeCardProps {
  label: string;
  minutes: number;
  recipeId: string;
  recipeName: string;
}

/**
 * The recipe's cook-time countdown, rendered as one tile of the meta card.
 * The timer is backed by the persistent `timerStore`, so it keeps running
 * across screen navigation and app backgrounding, and surfaces in system
 * notifications. Prep time has no timer — see `recipe-meta-card`.
 *
 * @remarks
 * - **The badge carries the timer's state**: the brand fill with a light ring
 *   while it counts, the success tint and a check once it is done.
 */
export const TimeCard = ({
  label,
  minutes,
  recipeId,
  recipeName,
}: TimeCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const timer = useRecipeTimer({
    timerId: cookTimerId(recipeId),
    recipeId,
    recipeName,
    minutes,
  });

  const { isActive, isPaused, isDone, remainingSeconds } = timer;
  const isCounting = isActive && !isDone;
  const iconBg = isDone ? colors.successLight : isCounting ? colors.primary : colors.primaryLight;
  const iconTint = isDone ? colors.success : isCounting ? colors.onOverlay : colors.primary;

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
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: iconBg },
          isCounting ? [styles.ring, { borderColor: colors.primaryLight }] : null,
        ]}
      >
        <Ionicons name={isDone ? 'checkmark' : 'flame-outline'} size={iconSizes.lg} color={iconTint} />
      </View>
      <StatTileText value={valueText} label={label} valueColor={isDone ? colors.success : undefined} />
      {controls}
    </View>
  );
};

const styles = StyleSheet.create({
  segment: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs2,
  },
  iconWrap: {
    width: decorSizes.statBadge,
    height: decorSizes.statBadge,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderWidth: borderWidths.thick,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
