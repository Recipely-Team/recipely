import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { isWeb } from '@infrastructure/constants/platform';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, layoutSizes, zIndices } from '@presentation/base/theme';

export interface HoverTooltipProps {
  /** Shown in the floating bubble on web hover. */
  label: string;
  /** Screen-reader name for the trigger, on every platform. May equal `label` or say more. */
  accessibilityLabel: string;
  children: React.ReactNode;
}

/**
 * Explains the mark it wraps: a bubble on web hover, an accessible name everywhere.
 *
 * @remarks
 * - **Two answers to one question, because the platforms ask it differently.** A
 *   pointer can hover; a finger cannot. So the bubble is web-only and the
 *   accessible name is unconditional — never the bubble alone, or the
 *   information would exist only for people using a mouse.
 * - **One hover region, deliberately.** Both handlers sit on the outer `View`
 *   that also contains the bubble, so moving the pointer from the mark onto the
 *   bubble never fires `onMouseLeave`. That is WCAG 1.4.13's "hoverable" with
 *   no bookkeeping, and no auto-dismiss timer is its "persistent".
 * - **Nothing is rendered on native.** `isWeb()` short-circuits before the hover
 *   state is read, so a screen reader finds no dead element under its finger.
 * - **No Escape-key dismissal**, which 1.4.13 also asks for. Accepted here only
 *   because nothing is hover-exclusive: every label this shows is also the
 *   accessible name, and on the detail screen it is visible text as well. A
 *   reuse where the bubble is the ONLY place the information lives has to add
 *   it first.
 */
export const HoverTooltip = ({
  label,
  accessibilityLabel,
  children,
}: HoverTooltipProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const [isHovered, setIsHovered] = useState(false);
  const hoverable = isWeb();

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={styles.trigger}
      {...(hoverable
        ? { onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false) }
        : {})}
    >
      {children}

      {hoverable && isHovered ? (
        <View style={[styles.bubble, { backgroundColor: colors.overlay }]}>
          <ThemedText style={[styles.label, { color: colors.onOverlay }]}>{label}</ThemedText>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  trigger: { position: 'relative' },
  bubble: {
    position: 'absolute',
    top: '100%',
    marginTop: spacing.xs,
    maxWidth: layoutSizes.tooltipMaxWidth,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.xs,
    zIndex: zIndices.raised,
  },
  label: { fontSize: fontSizes.micro },
});
