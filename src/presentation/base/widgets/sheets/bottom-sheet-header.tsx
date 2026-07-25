import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontWeights } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

// Matches the pre-existing header layout (both side slots reserve the same
// width so the centered title doesn't jump depending on which controls render).
const HEADER_SIDE_MIN_WIDTH = 50;

export interface BottomSheetHeaderProps {
  title: string;
  onClose: () => void;
  showCloseButton: boolean;
  rightAction?: { label: string; onPress: () => void };
}

/** Title row for {@link BottomSheet}: optional "×" close button, centered title, optional right action. */
export const BottomSheetHeader = ({
  title,
  onClose,
  showCloseButton,
  rightAction,
}: BottomSheetHeaderProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={styles.header}>
      {showCloseButton ? (
        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={styles.headerSide}
          accessibilityRole="button"
          accessibilityLabel={t().common.close}
        >
          <ThemedText variant="body" muted>×</ThemedText>
        </Pressable>
      ) : (
        <View style={styles.headerSide} />
      )}
      <ThemedText variant="subtitle">{title}</ThemedText>
      {rightAction !== undefined ? (
        <Pressable
          onPress={rightAction.onPress}
          hitSlop={8}
          style={[styles.headerSide, styles.headerRight]}
          accessibilityRole="button"
          accessibilityLabel={rightAction.label}
        >
          <ThemedText
            variant="body"
            style={[styles.rightActionLabel, { color: colors.primary }]}
          >
            {rightAction.label}
          </ThemedText>
        </Pressable>
      ) : (
        <View style={[styles.headerSide, styles.headerRight]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerSide: {
    minWidth: HEADER_SIDE_MIN_WIDTH,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  rightActionLabel: {
    fontWeight: fontWeights.semibold,
  },
});
