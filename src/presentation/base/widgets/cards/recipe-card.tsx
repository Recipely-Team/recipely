import { Pressable, StyleSheet, View } from 'react-native';
import { isWeb } from '@infrastructure/constants/platform';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  mediaSizes,
  opacities,
  iconSizes,
  durations,
} from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { t } from '@presentation/i18n';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { ValueConstants } from '@core/constants';
import { CARD_HOVER_LIFT } from '@presentation/base/widgets/cards/card-hover-lift';
import { RECIPE_CARD_TAG_LIMIT } from '@presentation/base/widgets/cards/recipe-card-tag-limit';
import { formatRating } from '@presentation/base/utils/format-rating';

/** How far the card dips under a press, and how long each half takes. */
const PRESS_SCALE = 0.97;
const PRESS_IN_MS = 100;
const PRESS_OUT_MS = 150;

export interface RecipeCardProps {
  name: string;
  image: string;
  cuisine: string;
  difficulty: string;
  rating: number;
  /** Omitted for lean list/grid contexts (`RecipeSummaryEntity` has no tags); the tags row is hidden when absent or empty. */
  tags?: string[];
  likeCount?: number;
  likedByMe?: boolean;
  onPress: () => void;
  onLike?: () => void;
  /** Web-only: lift the card slightly on mouse hover (used by the web grid). */
  hoverEffect?: boolean;
}

/** Animated pressable card showing recipe image, cuisine badge, rating stars, tags, and like count. */
export const RecipeCard = ({
  name, image, cuisine, difficulty, rating, tags = [],
  likeCount = ValueConstants.zero, likedByMe = false,
  onPress, onLike, hoverEffect = false,
}: RecipeCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const scale = useSharedValue(ValueConstants.one);
  const opacity = useSharedValue(ValueConstants.one);
  const heartScale = useSharedValue(ValueConstants.one);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Web-only hover lift: scale up slightly when the pointer enters the card.
  const hoverProps =
    hoverEffect && isWeb()
      ? {
          onMouseEnter: () => {
            scale.value = withTiming(CARD_HOVER_LIFT, { duration: durations.hover });
          },
          onMouseLeave: () => {
            scale.value = withTiming(ValueConstants.one, { duration: durations.hover });
          },
        }
      : {};

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  const handleLike = () => {
    heartScale.value = withSpring(1.4, { damping: 4 }, () => {
      heartScale.value = withSpring(1);
    });
    onLike?.();
  };

  return (
    <Animated.View style={animatedStyle}>
    <Pressable
      {...hoverProps}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(PRESS_SCALE, { duration: PRESS_IN_MS });
        opacity.value = withTiming(opacities.pressedFaint, { duration: PRESS_IN_MS });
      }}
      onPressOut={() => {
        scale.value = withTiming(ValueConstants.one, { duration: PRESS_OUT_MS });
        opacity.value = withTiming(opacities.full, { duration: PRESS_OUT_MS });
      }}
      style={[
        styles.card,
        shadows.md,
        { backgroundColor: colors.cardBackground },
      ]}
    >
      <View style={styles.imageContainer}>
        <RecipeImage
          uri={image}
          style={styles.image}
          accessibilityLabel={name}
          placeholderLabel={t().recipes.noPhoto}
        />
        <View style={[styles.cuisineBadge, { backgroundColor: colors.primary }]}>
          <ThemedText variant="caption" style={{ color: colors.primaryText, fontWeight: fontWeights.semibold }}>
            {cuisine}
          </ThemedText>
        </View>
        <View style={[styles.difficultyChip, { backgroundColor: colors.overlay }]}>
          <ThemedText variant="caption" style={{ color: colors.onOverlay, fontWeight: fontWeights.semibold }}>
            {difficulty}
          </ThemedText>
        </View>
      </View>
      <View style={styles.info}>
        <ThemedText variant="subtitle" numberOfLines={ValueConstants.one}>{name}</ThemedText>
        <View style={styles.bottomRow}>
          <View style={styles.tagsRow}>
            {tags.length > ValueConstants.zero
              ? tags
                  .slice(ValueConstants.zero, RECIPE_CARD_TAG_LIMIT)
                  .map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: colors.chipBackground }]}>
                    <ThemedText variant="caption" style={{ color: colors.chipText }}>{tag}</ThemedText>
                  </View>
                ))
              : null}
          </View>
          <View style={styles.metaRow}>
            <View style={styles.ratingRow}>
              {Array.from({ length: 5 }, (_, i) => {
                const iconName = i < fullStars ? 'star' : i === fullStars && hasHalf ? 'star-half-full' : 'star-outline';
                return (
                  <MaterialCommunityIcons
                    key={i}
                    name={iconName}
                    size={iconSizes.sm}
                    color={i < fullStars || (i === fullStars && hasHalf) ? colors.starFilled : colors.starEmpty}
                  />
                );
              })}
              <ThemedText variant="caption" muted style={styles.ratingText}>
                {formatRating(rating)}
              </ThemedText>
            </View>
            {onLike !== undefined ? (
              <Pressable
                onPress={handleLike}
                accessibilityRole="button"
                accessibilityLabel={likedByMe ? t().recipes.unlike : t().recipes.like}
                hitSlop={spacing.sm}
                style={styles.likeBtn}
              >
                <Animated.View style={[styles.likeInner, heartStyle]}>
                  <MaterialCommunityIcons
                    name={likedByMe ? 'heart' : 'heart-outline'}
                    size={iconSizes.md}
                    color={likedByMe ? colors.likeActive : colors.textMuted}
                  />
                  {likeCount > ValueConstants.zero ? (
                    <ThemedText variant="caption" muted style={styles.likeCount}>
                      {likeCount}
                    </ThemedText>
                  ) : null}
                </Animated.View>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  imageContainer: {
    height: mediaSizes.cardImageHeight,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cuisineBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.xs,
  },
  difficultyChip: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.xs,
  },
  info: {
    padding: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: ValueConstants.one,
  },
  tag: {
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: spacing.xs,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  likeCount: {
    fontSize: fontSizes.small,
  },
});
