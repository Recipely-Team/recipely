import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { controlSizes, iconSizes, radii, spacing, zIndices } from '@presentation/base/theme';

export interface DetailBackButtonProps {
  /**
   * Where back actually goes.
   *
   * The glyph alone announced nothing at all to a screen reader, so the label
   * names the destination rather than the chevron.
   */
  label: string;
  /** Below the status bar: the gallery runs edge to edge underneath it. */
  top: number;
}

/** The floating back control over the photo, on the phone layout only. */
export const DetailBackButton = ({ label, top }: DetailBackButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.back()}
      style={[styles.button, { top, backgroundColor: colors.overlayLight }]}
    >
      <Ionicons name="chevron-back" size={iconSizes.xxl} color={colors.onOverlay} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // Pinned: a circle, not a text box.
  button: {
    position: 'absolute',
    left: spacing.lg,
    width: controlSizes.floatingBtn,
    height: controlSizes.floatingBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndices.floatingAction,
  },
});
