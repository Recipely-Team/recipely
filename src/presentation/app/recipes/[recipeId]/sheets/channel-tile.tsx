import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, borderWidths, opacities } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

const CHANNEL_CHIP_SIZE = controlSizes.channelChip;

export interface ChannelTileProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}

/** A single share-channel tile: a round icon chip above a label. */
export const ChannelTile = ({ icon, label, onPress }: ChannelTileProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.channelTile,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
          opacity: pressed ? opacities.pressed : opacities.full,
        },
      ]}
    >
      <View style={[styles.channelChip, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name={icon} size={iconSizes.xl} color={colors.primary} />
      </View>
      <ThemedText variant="caption" style={styles.channelLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  channelTile: {
    flex: ValueConstants.one,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: borderWidths.hairline,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  channelChip: {
    width: CHANNEL_CHIP_SIZE,
    height: CHANNEL_CHIP_SIZE,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelLabel: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
});
