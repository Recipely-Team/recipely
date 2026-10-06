import { Pressable, StyleSheet, View } from 'react-native';
import { isWeb } from '@infrastructure/constants/platform';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontSizes,
  aspectRatios,
  opacities,
  iconSizes,
  durations,
} from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { t } from '@presentation/i18n';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ValueConstants } from '@core/constants';
import { CARD_HOVER_LIFT } from '@presentation/base/widgets/cards/card-hover-lift';
import { RECIPE_CARD_TAG_LIMIT } from '@presentation/base/widgets/cards/recipe-card-tag-limit';
import type { ProvenanceMarkType } from '@domain/recipes/provenance/provenance-mark';
import type { OwnerStatusType } from '@domain/recipes/publishing/owner-status';
import type { FocalPoint } from '@domain/recipes/media/focal-point';
import { RecipeCardCover } from '@presentation/base/widgets/cards/recipe-card-cover';
import { PhotoCountChip } from '@presentation/base/widgets/badges/photo-count-chip';
import { CardPhotoButton } from '@presentation/base/widgets/cards/card-photo-button';
import { RecipeCardRating } from '@presentation/base/widgets/cards/recipe-card-rating';

/** How far the card dips under a press, and how long each half takes. */
const PRESS_SCALE = 0.97;
const PRESS_IN_MS = 100;
const PRESS_OUT_MS = 150;

export interface RecipeCardProps {
  name: string;
  image: string;
  /** Where the dish sits in the cover; the crop centres on it. */
  imageFocus?: FocalPoint;
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
  /** Where the recipe came from. A hand-written one carries none and draws no seal. */
  provenance?: readonly ProvenanceMarkType[];
  /** The owner's view of the recipe (Created tab): a status badge on the photo's bottom-left. */
  ownerStatus?: OwnerStatusType;
  /** How many photos the recipe has, when the caller knows; a chip shows it from two up. */
  photoCount?: number;
  /** The Created tab's camera on the cover, which takes the owner to the recipe's photos. */
  onEditPhotos?: () => void;
}

/**
 * Animated pressable card showing recipe image, cuisine badge, rating stars, tags, and like count.
 *
 * @remarks
 * - **The cover's bottom-right is a sibling of the card's press target.** The
 *   Created tab's camera is a button of its own, and a button inside the
 *   card's button is invalid markup on the web; the cluster is laid over the
 *   same 16:10 box instead.
 */
export const RecipeCard = ({
  name, image, imageFocus, cuisine, difficulty, rating, tags = [],
  likeCount = ValueConstants.zero, likedByMe = false,
  onPress, onLike, hoverEffect = false, provenance = [], ownerStatus, photoCount = ValueConstants.zero, onEditPhotos,
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
      <RecipeCardCover
        name={name}
        image={image}
        imageFocus={imageFocus}
        cuisine={cuisine}
        difficulty={difficulty}
        provenance={provenance}
        {...(ownerStatus !== undefined ? { ownerStatus } : {})}
      />
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
            <RecipeCardRating rating={rating} />
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
    <View style={styles.coverOverlay} pointerEvents="box-none">
      <View style={[styles.coverCorner, onEditPhotos !== undefined ? styles.cornerCreated : null]} pointerEvents="box-none">
        <View pointerEvents="none">
          <PhotoCountChip count={photoCount} />
        </View>
        {onEditPhotos !== undefined ? <CardPhotoButton onPress={onEditPhotos} /> : null}
      </View>
    </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  // The cover's own box, laid over it; see the doc block for why it is not inside.
  coverOverlay: {
    position: 'absolute',
    top: ValueConstants.zero,
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    aspectRatio: aspectRatios.heroWide,
  },
  coverCorner: {
    position: 'absolute',
    right: spacing.sm2,
    bottom: spacing.sm2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
  },
  cornerCreated: {
    right: spacing.sm,
    bottom: spacing.sm,
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
