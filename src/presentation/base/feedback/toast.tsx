import { useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import {
  toastBackground,
  TOAST_FOREGROUND,
} from '@presentation/base/theme/colors/surfaces/error-surfaces';
import type { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontSizes, fontWeights, iconSizes, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { DEFAULT_TOAST_DURATION_MS } from '@presentation/base/feedback/toast-model';
import type { ToastItem } from '@presentation/base/feedback/toast-item';
import { ValueConstants } from '@core/constants';
import { AnimationConstants } from '@presentation/base/constants';

const ENTER_OFFSET = 16;
const EXIT_DURATION_MS = 160;
const ICON_CHIP_SIZE = 26;
const ICON_CHIP_ALPHA = '26'; // ~15% — tints the chip behind the accent icon.

const SEVERITY_ICON: Record<SeverityType, keyof typeof Ionicons.glyphMap> = {
  danger: 'alert-circle',
  warning: 'warning',
  success: 'checkmark-circle',
  neutral: 'information-circle',
};

export interface ToastProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

/**
 * A single floating toast pill. Animates in on mount, auto-dismisses after its
 * duration (unless `durationMs` is 0), and animates out before the store drops
 * it. The accent (icon + action) color comes from the severity surface; the
 * pill itself is the fixed dark toast surface in both themes.
 */
export const Toast = ({ item, onDismiss }: ToastProps): React.JSX.Element => {
  const { scheme } = useTheme();
  const surfaces = useSeveritySurfaces();
  const accent = surfaces[item.severity].icon;
  const anim = useRef(new Animated.Value(ValueConstants.zero)).current;

  const dismiss = useCallback(() => {
    Animated.timing(anim, {
      toValue: ValueConstants.zero,
      duration: EXIT_DURATION_MS,
      useNativeDriver: true,
    }).start(() => onDismiss(item.id));
  }, [anim, item.id, onDismiss]);

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 9,
      tension: 80,
    }).start();
    const duration = item.durationMs ?? DEFAULT_TOAST_DURATION_MS;
    if (duration <= ValueConstants.zero) return;
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [anim, item.durationMs, dismiss]);

  const handleAction = useCallback(() => {
    item.onAction?.();
    dismiss();
  }, [item, dismiss]);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        shadows.lg,
        {
          backgroundColor: toastBackground(scheme),
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                // Copied: Animated.interpolate takes a mutable `number[]`.
                inputRange: [...AnimationConstants.progressRange],
                outputRange: [ENTER_OFFSET, ValueConstants.zero],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.iconChip, { backgroundColor: accent + ICON_CHIP_ALPHA }]}>
        <Ionicons name={SEVERITY_ICON[item.severity]} size={iconSizes.md} color={accent} />
      </View>
      <Text numberOfLines={2} style={[styles.message, { color: TOAST_FOREGROUND }]}>
        {item.message}
      </Text>
      {item.actionLabel !== undefined ? (
        <Pressable
          onPress={handleAction}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={item.actionLabel}
        >
          <Text style={[styles.action, { color: accent }]}>{item.actionLabel}</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={dismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t().errors.dismiss}
        >
          <Ionicons name="close" size={iconSizes.md} color={TOAST_FOREGROUND} style={styles.close} />
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    width: '100%',
  },
  iconChip: {
    width: ICON_CHIP_SIZE,
    height: ICON_CHIP_SIZE,
    borderRadius: ICON_CHIP_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: ValueConstants.one,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  action: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  close: {
    opacity: opacities.pressedStrong,
  },
});
