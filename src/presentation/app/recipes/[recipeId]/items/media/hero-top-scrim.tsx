import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { BrandColors } from '@presentation/base/theme/colors/palette/brand-colors';
import { photoViewerSizes } from '@presentation/app/recipes/[recipeId]/model/photos/photo-viewer-sizes';
import { ValueConstants } from '@core/constants';

/**
 * The shade across the top of the phone hero, so the back, share, like and
 * save circles and the status bar read on a white plate. Decorative and
 * untouchable.
 */
export const HeroTopScrim = (): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <LinearGradient
      pointerEvents="none"
      colors={[colors.overlayLight, BrandColors.photoScrimClear]}
      start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
      end={{ x: ValueConstants.zero, y: ValueConstants.one }}
      style={styles.scrim}
    />
  );
};

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: ValueConstants.zero,
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    height: photoViewerSizes.topScrimHeight,
  },
});
