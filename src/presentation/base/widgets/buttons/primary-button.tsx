import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, controlSizes, opacities } from '@presentation/base/theme';

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/** Full-width themed button with loading spinner support. */
export const PrimaryButton = ({
  label,
  onPress,
  loading = false,
  disabled = false,
}: PrimaryButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const isInteractive = !loading && !disabled;
  const backgroundColor = isInteractive ? colors.primary : colors.border;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={!isInteractive}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          opacity: pressed && isInteractive ? opacities.pressedSubtle : opacities.full,
        },
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <ThemedText variant="subtitle" style={{ color: colors.primaryText }}>
            {label}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg2,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controlSizes.button,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
