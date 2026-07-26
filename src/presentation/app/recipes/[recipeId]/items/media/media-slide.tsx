import { StyleSheet, View } from 'react-native';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { t } from '@presentation/i18n';
import type { MediaItem } from '@domain/recipes/media/media-item';

interface MediaSlideProps {
  item: MediaItem;
  width: number;
  height: number;
}

/** Renders a single recipe photo sized to the given dimensions. */
export const MediaSlide = ({ item, width, height }: MediaSlideProps): React.JSX.Element => (
  <View style={{ width, height }}>
    <RecipeImage
      uri={item.url}
      style={styles.coverImage}
      placeholderLabel={t().recipes.noPhoto}
    />
  </View>
);

const styles = StyleSheet.create({
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
