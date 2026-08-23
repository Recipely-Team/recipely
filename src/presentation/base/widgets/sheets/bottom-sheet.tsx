import { type ReactNode } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { BottomSheetHeader } from '@presentation/base/widgets/sheets/bottom-sheet-header';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useDragToDismiss } from '@presentation/base/hooks/interaction/use-drag-to-dismiss';
import { useSheetPresentation } from '@presentation/base/hooks/interaction/use-sheet-presentation';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { spacing, radii, controlSizes, borderWidths, layoutSizes } from '@presentation/base/theme';
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
 * Modal sheet with a header, optional close button, a scrollable content area
 * and an optional pinned {@link BottomSheetProps.footer}.
 *
 * @remarks
 * - **Presentation is per viewport.** On a phone it is a bottom sheet, dragged
 *   or tapped away by its grabber. Once the viewport is expanded it is a
 *   centred dialog: a panel glued to the bottom edge of a desktop window is a
 *   touch idiom with nothing to reach for it there, and the grabber promises a
 *   drag gesture a mouse never performs. A 13" tablet lands on the same answer
 *   for its own reason — the bottom edge is a thumb-stretch away and iPadOS
 *   centres its sheets — so this asks `isExpanded`, not `isWebShell`. Every
 *   sheet in the app goes through this component, so the rule holds app-wide
 *   rather than per call site.
 * - **The window does not animate itself.** `Modal`'s own `animationType`
 *   moves everything it contains, backdrop included, so closing a sheet slid
 *   the dimming down the screen with the panel. Opening and closing therefore
 *   belong to {@link useSheetPresentation}, which keeps the scrim out of the
 *   panel's motion and holds the `Modal` open for the length of the exit.
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
  const { isExpanded } = useLayout();
  const { translateY, panHandlers } = useDragToDismiss(onClose, visible);
  const { isMounted, scrim, panelMotion, measure } = useSheetPresentation(
    visible,
    isExpanded,
    translateY,
  );

  return (
    <Modal
      visible={isMounted}
      transparent
      // Owned here, not by the window: see the scrim remark above.
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoider style={[styles.root, isExpanded ? styles.rootWeb : null]}>
        <Animated.View
          style={[styles.backdrop, { backgroundColor: colors.overlay, opacity: scrim }]}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} />
        </Animated.View>
        <Animated.View
          onLayout={measure}
          pointerEvents={visible ? 'auto' : 'none'}
          style={[
            styles.sheet,
            isExpanded ? styles.dialog : null,
            {
              backgroundColor: colors.background,
              paddingBottom: isExpanded ? spacing.lg : Math.max(insets.bottom, spacing.lg),
            },
            panelMotion,
          ]}
        >
          {isExpanded ? null : (
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
          )}
          <BottomSheetHeader
            title={title}
            onClose={onClose}
            // The grabber is the mobile dismiss affordance; without it the
            // dialog needs a visible close control of its own.
            showCloseButton={showCloseButton || isExpanded}
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
  rootWeb: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '78%',
    // Clips its own children to the rounded corners. Without it the scroll
    // area and the header paint square corners over the radius, which reads as
    // two odd notches at the top edge of the sheet.
    overflow: 'hidden',
  },
  dialog: {
    width: '100%',
    maxWidth: layoutSizes.dialogMaxWidth,
    borderRadius: radii.xl,
    maxHeight: '80%',
    overflow: 'hidden',
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
