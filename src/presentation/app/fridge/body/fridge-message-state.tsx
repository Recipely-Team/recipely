import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fontSizes, fontWeights, fridgeSizes, iconSizes, layoutSizes, lineHeights, radii, spacing } from '@presentation/base/theme';
import { FridgePrimaryButton } from '@presentation/app/fridge/items/buttons/fridge-primary-button';
import { GhostButton } from '@presentation/app/fridge/items/buttons/ghost-button';

export interface FridgeMessageStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
}

/**
 * A full-screen state of the flow — "nothing recognised" and the daily limit:
 * a 64 disc, a 19-ish heavy title, a body line, and two actions stacked.
 */
export const FridgeMessageState = ({ icon, title, body, primaryLabel, onPrimary, secondaryLabel, onSecondary }: FridgeMessageStateProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.root} accessibilityLiveRegion="polite">
      <View style={[styles.disc, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name={icon} size={iconSizes.xxxl} color={colors.primary} />
      </View>
      <SizedText accessibilityRole="header" size={fontSizes.subheading} weight={fontWeights.heavy} ratio={lineHeights.tight} style={styles.center}>
        {title}
      </SizedText>
      <SizedText size={fontSizes.medium} ratio={lineHeights.normal} muted style={styles.center}>
        {body}
      </SizedText>
      <View style={styles.actions}>
        <FridgePrimaryButton label={primaryLabel} onPress={onPrimary} />
        <GhostButton label={secondaryLabel} onPress={onSecondary} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xxxl,
  },
  disc: {
    width: fridgeSizes.cameraDisc,
    height: fridgeSizes.cameraDisc,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  center: {
    textAlign: 'center',
    maxWidth: layoutSizes.maxContentLg,
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
