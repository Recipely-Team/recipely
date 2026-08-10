import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { spacing, radii, fontSizes, fontWeights, lineHeightFor, iconSizes, controlSizes, decorSizes, layoutSizes, borderWidths, opacities, zIndices } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

const SEVERITY_ICON = {
  success: 'checkmark',
  danger: 'alert',
} as const;

export interface FeedbackDialogProps {
  visible: boolean;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  /** Visual tone of the disc + icon; success by default. */
  severity?: 'success' | 'danger';
  /**
   * Optional SECOND action, shown beside the primary. Only for a real
   * alternative — "dismiss" is the ✕ and the backdrop, and a button that
   * duplicates them just makes the user choose between two ways to do nothing.
   */
  secondaryLabel?: string;
  onSecondary?: () => void;
  onClose: () => void;
}

/**
 * Centered operation-outcome dialog (a true modal alert, not a bottom sheet).
 *
 * @remarks
 * - **Closing is the ✕, not a button.** The dialog reports an outcome; the only
 *   thing a user must be able to do is leave. That is the ✕ (and the backdrop),
 *   so the action row is free to hold actions that actually DO something.
 * - **Two actions sit side by side**, not stacked: they are peers, and stacking
 *   them reads as one being the way out of the other.
 * - Cross-platform: works on the web, where `Alert.alert` is a no-op.
 */
export const FeedbackDialog = ({
  visible,
  title,
  message,
  primaryLabel,
  onPrimary,
  severity = 'success',
  secondaryLabel,
  onSecondary,
  onClose,
}: FeedbackDialogProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const surface = useSeveritySurfaces()[severity];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        {/* Backdrop tap dismisses, mirroring the BottomSheet affordance. */}
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t().common.close}
        />
        <View
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: colors.background }]}
        >
          <Pressable
            onPress={onClose}
            hitSlop={spacing.sm}
            accessibilityRole="button"
            accessibilityLabel={t().common.close}
            style={({ pressed }) => [styles.close, { opacity: pressed ? opacities.pressed : opacities.full }]}
          >
            <Ionicons name="close" size={iconSizes.lg} color={colors.textMuted} />
          </Pressable>
          <View style={[styles.disc, { backgroundColor: surface.disc }]}>
            <Ionicons name={SEVERITY_ICON[severity]} size={iconSizes.xxxl} color={surface.icon} />
          </View>
          <ThemedText variant="subtitle" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText variant="body" muted style={styles.message}>
            {message}
          </ThemedText>
          <View style={styles.actions}>
            {secondaryLabel !== undefined && onSecondary !== undefined ? (
              <Pressable
                onPress={onSecondary}
                accessibilityRole="button"
                accessibilityLabel={secondaryLabel}
                style={({ pressed }) => [
                  styles.action,
                  styles.secondary,
                  { borderColor: colors.border, opacity: pressed ? opacities.pressed : opacities.full },
                ]}
              >
                <ThemedText variant="body" style={styles.actionLabel}>
                  {secondaryLabel}
                </ThemedText>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onPrimary}
              accessibilityRole="button"
              accessibilityLabel={primaryLabel}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: colors.primary, opacity: pressed ? opacities.pressed : opacities.full },
              ]}
            >
              <ThemedText variant="body" style={[styles.actionLabel, { color: colors.primaryText }]}>
                {primaryLabel}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: layoutSizes.dialogMaxWidth,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  disc: {
    width: decorSizes.feedbackDisc,
    height: decorSizes.feedbackDisc,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
    fontWeight: fontWeights.bold,
    marginBottom: spacing.sm,
  },
  message: {
    textAlign: 'center',
    lineHeight: lineHeightFor(fontSizes.body),
    marginBottom: spacing.lg,
  },
  close: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: zIndices.raised,
  },
  actions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    // Equal halves when there are two, full width when there is one — the row
    // needs no branch, `flex: 1` produces both.
    flex: ValueConstants.one,
    minHeight: controlSizes.button,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    borderWidth: borderWidths.thin,
  },
  actionLabel: {
    fontWeight: fontWeights.semibold,
  },
});
