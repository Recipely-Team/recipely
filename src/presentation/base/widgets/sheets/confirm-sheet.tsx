import { Pressable, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  lineHeightFor,
  controlSizes,
  opacities,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  /** Renders the confirm action in the danger palette (delete / sign out). */
  destructive?: boolean;
  /** Disables the actions and swaps the confirm label for a loading string while a request is in flight. */
  loading?: boolean;
  /** Inline error surfaced inside the still-open sheet after a failed confirm. */
  error?: string;
}

/**
 * Cross-platform confirmation dialog built on {@link BottomSheet} (a themed
 * modal), so it works on web where `Alert.alert` is a no-op. Presents a
 * cancellable prompt with a Cancel action and a primary/destructive Confirm
 * action, keeping the sheet open on failure to show an inline error.
 */
export const ConfirmSheet = ({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  destructive = false,
  loading = false,
  error,
}: ConfirmSheetProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const confirmBackground = destructive ? colors.dangerLight : colors.primary;
  const confirmLabelColor = destructive ? colors.danger : colors.primaryText;

  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <ThemedText variant="body" muted style={styles.message}>
        {message}
      </ThemedText>
      {error !== undefined ? (
        <ThemedText variant="caption" style={[styles.error, { color: colors.danger }]}>
          {error}
        </ThemedText>
      ) : null}
      <View style={styles.actions}>
        <Pressable
          onPress={onClose}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={t().common.cancel}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.surface,
              opacity: pressed || loading ? opacities.pressedStrong : opacities.full,
            },
          ]}
        >
          <ThemedText variant="body" style={styles.buttonLabel}>
            {t().common.cancel}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={confirmLabel}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: confirmBackground,
              opacity: pressed || loading ? opacities.pressedStrong : opacities.full,
            },
          ]}
        >
          <ThemedText variant="body" style={[styles.buttonLabel, { color: confirmLabelColor }]}>
            {loading ? t().common.loading : confirmLabel}
          </ThemedText>
        </Pressable>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  message: {
    marginBottom: spacing.lg,
    lineHeight: lineHeightFor(fontSizes.body),
  },
  error: {
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: ValueConstants.one,
    minHeight: controlSizes.button,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontWeight: fontWeights.semibold,
  },
});
