import { type ReactNode } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { BottomSheetHeader } from '@presentation/base/widgets/sheets/bottom-sheet-header';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useDragToDismiss } from '@presentation/base/hooks/interaction/use-drag-to-dismiss';
import { spacing, radii, controlSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface BottomSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  /**
   * Shows the header "×" close button. Defaults to hidden: the grabber
   * (tap or drag) is the app's single dismiss affordance, on top of the
   * backdrop tap — see `use-drag-to-dismiss.ts`. Opt in only where a call
   * site genuinely needs a second, always-visible close control.
   */
  showCloseButton?: boolean;
  rightAction?: { label: string; onPress: () => void };
  children: ReactNode;
}

/** Modal bottom sheet with a draggable grabber, header, optional close button, and scrollable content area. */
export const BottomSheet = ({
  visible,
  title,
  onClose,
  showCloseButton = false,
  rightAction,
  children,
}: BottomSheetProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { translateY, panHandlers } = useDragToDismiss(onClose, visible);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoider style={styles.root}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, spacing.lg),
              transform: [{ translateY }],
            },
          ]}
        >
          <View
            {...panHandlers}
            style={styles.grabberWrap}
            hitSlop={spacing.sm}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t().common.close}
            accessibilityHint={t().common.closeHint}
            onAccessibilityTap={onClose}
          >
            <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          </View>
          <BottomSheetHeader
            title={title}
            onClose={onClose}
            showCloseButton={showCloseButton}
            rightAction={rightAction}
          />
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '78%',
  },
  grabberWrap: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  grabber: {
    width: controlSizes.iconBtn,
    height: spacing.xs,
    borderRadius: radii.xs,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
