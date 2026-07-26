import { type ReactNode } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { BottomSheetHeader } from '@presentation/base/widgets/sheets/bottom-sheet-header';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useDragToDismiss } from '@presentation/base/hooks/interaction/use-drag-to-dismiss';
import { spacing, radii, controlSizes, borderWidths } from '@presentation/base/theme';
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
  /**
   * Pinned below the scroll area instead of inside it, for the sheet's primary
   * action. A sheet is capped at 78% of the screen, so a tall body (the recipe
   * filter sheet is five chip sections) pushes a CTA placed in `children` off
   * the bottom of the scroll — it exists, but the user has to scroll the whole
   * sheet to discover it. Anything the user must be able to reach at any scroll
   * position goes here; supporting content stays in `children`.
   */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Modal bottom sheet with a draggable grabber, header, optional close button, a
 * scrollable content area, and an optional pinned {@link BottomSheetProps.footer}.
 */
export const BottomSheet = ({
  visible,
  title,
  onClose,
  showCloseButton = false,
  rightAction,
  footer,
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
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer === undefined ? null : (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>{footer}</View>
          )}
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
  // flexShrink lets the scroll area give up height to the pinned footer once the
  // sheet hits its 78% cap; without it the ScrollView claims its content height
  // and pushes the footer past the bottom edge — the bug the footer prevents.
  scroll: {
    flexShrink: ValueConstants.one,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  // The hairline separates the pinned action from content scrolling behind it,
  // so it doesn't read as the last row of the list.
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: borderWidths.hairline,
  },
});
