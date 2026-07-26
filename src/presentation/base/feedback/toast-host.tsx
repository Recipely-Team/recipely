import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, controlSizes, zIndices } from '@presentation/base/theme';
import { Toast } from '@presentation/base/feedback/toast';
import { toastStore } from '@presentation/base/feedback/toast-store';
import { ValueConstants } from '@core/constants';

const MAX_WIDTH = 460;

/**
 * Renders the global toast stack, anchored above the bottom safe area and tab
 * bar. Mounted once at the root (next to `ActiveTimersBar`). `box-none` lets
 * touches pass through everywhere except the toasts themselves.
 */
export const ToastHost = (): React.JSX.Element | null => {
  const toasts = toastStore((s) => s.toasts);
  const dismiss = toastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();

  if (toasts.length === ValueConstants.zero) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFill,
        styles.host,
        { paddingBottom: insets.bottom + controlSizes.tabBar + spacing.md },
      ]}
    >
      <View pointerEvents="box-none" style={styles.stack}>
        {toasts.map((toast) => (
          <Toast key={toast.id} item={toast} onDismiss={dismiss} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    // Above ActiveTimersBar (100), below AlarmOverlay (201).
    zIndex: zIndices.toast,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  stack: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    gap: spacing.sm,
  },
});
