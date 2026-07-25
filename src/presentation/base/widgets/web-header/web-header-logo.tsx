import { Pressable, StyleSheet, View } from 'react-native';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, borderWidths, opacities, BrandColors } from '@presentation/base/theme';

export interface WebHeaderLogoProps {
  onPress: () => void;
}

const LOGO_TILE_SIZE = 38;
const LOGO_SIZE = 30;

/** White brand tile + Recipely wordmark. Anchors the WebHeader left edge. */
export const WebHeaderLogo = ({ onPress }: WebHeaderLogoProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel="Recipely"
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.tile,
          shadows.sm,
          { backgroundColor: BrandColors.white, borderColor: colors.cardBorder },
        ]}
      >
        <RecipelyLogo size={LOGO_SIZE} />
      </View>
      <View>
        <ThemedText style={[styles.wordmark, { color: colors.text }]}>Recipely</ThemedText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: opacities.pressedStrong,
  },
  tile: {
    width: LOGO_TILE_SIZE,
    height: LOGO_TILE_SIZE,
    borderRadius: radii.md,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: fontSizes.subtitle,
    fontWeight: fontWeights.heavy,
    letterSpacing: letterSpacings.tight,
  },
});
