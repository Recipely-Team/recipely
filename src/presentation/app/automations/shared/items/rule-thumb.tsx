import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { iconSizes, radii } from '@presentation/base/theme';

export interface RuleThumbProps {
  /** The post's cover; null draws the Instagram tile. */
  uri: string | null;
  size: number;
}

/** A post or Reel's square cover, or a chip-coloured tile with the Instagram glyph when it has none. */
export const RuleThumb = ({ uri, size }: RuleThumbProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const box = { width: size, height: size };
  if (uri === null) {
    return (
      <View style={[styles.tile, box, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="logo-instagram" size={iconSizes.lg} color={colors.chipText} />
      </View>
    );
  }
  return (
    <View style={[styles.tile, box]}>
      <RecipeImage uri={uri} placeholderCompact style={StyleSheet.absoluteFill} />
    </View>
  );
};

const styles = StyleSheet.create({
  tile: { borderRadius: radii.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
