import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { controlSizes, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface PhotoRemoveButtonProps {
  disabled: boolean;
  /** Lifted clear of whatever the screen draws over the frame's bottom edge. */
  bottom: number;
  onPress: () => void;
}

/** The owner's Remove on the photo in view. It only asks; the screen confirms before anything goes. */
export const PhotoRemoveButton = ({ disabled, bottom, onPress }: PhotoRemoveButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t().photoViewer.removeA11y}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, { bottom, backgroundColor: colors.overlay }]}
    >
      <Ionicons name="trash" size={iconSizes.md} color={colors.onOverlay} />
      <ThemedText style={[styles.label, { color: colors.onOverlay }]}>{t().photoViewer.remove}</ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.md,
    minHeight: controlSizes.floatingBtn,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
  },
  label: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
});
