import { StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, BrandColors } from '@presentation/base/theme';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';

export interface KitchenAvatarProps {
  size: number;
}

/** Share of the avatar the logo fills, leaving the white face a margin round it. */
const LOGO_SHARE = 0.68;

/**
 * Recipely Kitchen's avatar on the detail screen: the full-colour logo on the
 * provenance seal's white face, so the author and the seal read as one source.
 * Decorative — the name beside it says who it is.
 */
export const KitchenAvatar = ({ size }: KitchenAvatarProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.face,
        { width: size, height: size, borderRadius: size / ValueConstants.two, borderColor: colors.cardBorder },
      ]}
    >
      <RecipelyLogo size={Math.round(size * LOGO_SHARE)} />
    </View>
  );
};

const styles = StyleSheet.create({
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.white,
    borderWidth: borderWidths.hairline,
  },
});
