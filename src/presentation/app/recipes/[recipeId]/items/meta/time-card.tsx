import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ControlButton } from '@presentation/app/recipes/[recipeId]/items/control-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useRecipeTimer } from '@presentation/base/hooks/timers/use-recipe-timer';
import { formatTimer } from '@presentation/base/utils/format-timer';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface TimeCardProps {
  label: string;
  minutes: number;
  iconName: keyof typeof Ionicons.glyphMap;
  recipeId: string;
  recipeName: string;
  /** Distinguishes the prep vs cook timer for the same recipe (`'prep'` | `'cook'`). */
  slot: string;
  /**
   * When true the card renders chrome-less (no own border/background/radius) as a
   * flush, vertically-stacked segment inside a shared meta card. Countdown
   * behaviour is unchanged.
   */
  segment?: boolean;
}

/**
 * Vertical countdown card for a recipe prep/cook time. The timer is backed by
 * the persistent `timerStore`, so it keeps running across screen navigation
 * and app backgrounding, and surfaces in system notifications.
 */
export const TimeCard = ({
  label,
  minutes,
  iconName,
  recipeId,
  recipeName,
  slot,
  segment = false,
}: TimeCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const timer = useRecipeTimer({
    timerId: `${recipeId}:${slot}`,
    recipeId,
    recipeName,
    minutes,
  });

  const { isActive, isPaused, isDone, remainingSeconds } = timer;
  const borderColor = isDone
    ? colors.success
    : isActive
      ? colors.primary
      : colors.cardBorder;
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

  if (segment) {
    return (
      <View style={styles.segment}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={isDone ? 'checkmark' : iconName} size={iconSizes.lg} color={iconTint} />
        </View>
        <ThemedText
          style={[styles.value, styles.segmentValue, { color: isDone ? colors.success : colors.text }]}
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
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={isDone ? 'checkmark' : iconName} size={iconSizes.lg} color={iconTint} />
        </View>
        <ThemedText variant="label" muted style={styles.label} numberOfLines={2}>
          {label}
        </ThemedText>
      </View>

      <ThemedText
        style={[styles.value, { color: isDone ? colors.success : colors.text }]}
        numberOfLines={1}
      >
        {valueText}
      </ThemedText>

      {controls}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: ValueConstants.one,
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm2,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
  },
  segment: {
    flex: ValueConstants.one,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  segmentValue: {
    fontSize: fontSizes.heading,
  },
  segmentLabel: {
    fontSize: fontSizes.micro,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  iconWrap: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: ValueConstants.one,
    fontSize: fontSizes.micro,
  },
  value: {
    fontSize: fontSizes.display,
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
