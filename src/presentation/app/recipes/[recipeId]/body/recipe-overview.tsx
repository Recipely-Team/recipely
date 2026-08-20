import { Pressable, StyleSheet, View } from 'react-native';
import { StoreStatus } from '@application/store/store-status';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { SectionHeader } from '@presentation/base/widgets/text/section-header';
import { RecipeMetaCard } from '@presentation/app/recipes/[recipeId]/items/meta/recipe-meta-card';
import { NutritionCard } from '@presentation/app/recipes/[recipeId]/items/nutrition/nutrition-card';
import { RecipeAuthorCard } from '@presentation/app/recipes/[recipeId]/items/meta/recipe-author-card';
import { SkeletonLoader } from '@presentation/base/widgets/loading/skeleton-loader';
import type { RecipeAuthorState } from '@presentation/app/recipes/[recipeId]/model/author/recipe-author-state';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { spacing, radii, fontSizes, fontWeights, iconSizes, avatarSizes } from '@presentation/base/theme';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { ValueConstants } from '@core/constants';
import { formatRating } from '@presentation/base/utils/format-rating';

export interface RecipeOverviewProps {
  recipe: RecipeEntity;
  recipeId: string;
  liked: boolean;
  likeCount: number;
  commentTotal: number;
  authorState: RecipeAuthorState;
  onToggleLike: () => void;
}

/**
 * Recipe header block for the mobile detail screen: title, cuisine/rating caption,
 * like/view/comment stats, author card, meta card, nutrition, and tags.
 */
export const RecipeOverview = ({
  recipe,
  recipeId,
  liked,
  likeCount,
  commentTotal,
  authorState,
  onToggleLike,
}: RecipeOverviewProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { cuisineLabel } = useTaxonomyLabel();

  return (
    <>
      <ThemedText variant="title">{recipe.name}</ThemedText>

      <View style={styles.captionRow}>
        {recipe.cuisine.length > ValueConstants.zero ? (
          <View style={styles.captionItem}>
            <Ionicons name="globe-outline" size={iconSizes.md} color={colors.textMuted} />
            <ThemedText style={[styles.captionText, { color: colors.textMuted }]}>
              {cuisineLabel(recipe.cuisine).name}
            </ThemedText>
          </View>
        ) : null}
        {recipe.rating > ValueConstants.zero ? (
          <View style={styles.captionItem}>
            <Ionicons name="star" size={iconSizes.md} color={colors.starFilled} />
            <ThemedText style={[styles.captionRating, { color: colors.text }]}>
              {formatRating(recipe.rating)}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.statsStrip}>
        <Pressable
          onPress={onToggleLike}
          accessibilityRole="button"
          accessibilityLabel={liked ? t().recipes.unlike : t().recipes.like}
          style={styles.statItem}
        >
          <MaterialCommunityIcons
            name={liked ? 'heart' : 'heart-outline'}
            size={iconSizes.md}
            color={liked ? colors.likeActive : colors.textMuted}
          />
          <ThemedText style={[styles.statText, { color: liked ? colors.likeActive : colors.textMuted }]}>
            {String(likeCount)}
          </ThemedText>
        </Pressable>
        {recipe.viewCount > ValueConstants.zero ? (
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={iconSizes.md} color={colors.textMuted} />
            <ThemedText style={[styles.statText, { color: colors.textMuted }]}>
              {recipe.viewCount.toLocaleString()}
            </ThemedText>
          </View>
        ) : null}
        {commentTotal > ValueConstants.zero ? (
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={iconSizes.md} color={colors.textMuted} />
            <ThemedText style={[styles.statText, { color: colors.textMuted }]}>
              {String(commentTotal)}
            </ThemedText>
          </View>
        ) : null}
      </View>

      {/* WHY: placed here (right below the title/rating/stats
      row) rather than after nutrition — tester feedback flagged
      a large empty gap in this spot with the author card
      stranded far below; closing that gap here also reads
      better since "who made this" belongs near the title. */}
      {authorState.status === StoreStatus.Loading ? (
        <View style={styles.authorSkeleton}>
          <SkeletonLoader width={avatarSizes.md} height={avatarSizes.md} borderRadius={radii.round} />
          <View style={styles.authorSkeletonText}>
            <SkeletonLoader width="40%" height={fontSizes.micro} />
            <SkeletonLoader width="65%" height={fontSizes.body} />
          </View>
        </View>
      ) : authorState.status === StoreStatus.Resolved ? (
        <RecipeAuthorCard
          authorName={authorState.author.authorName}
          authorPhotoUrl={authorState.author.authorPhotoUrl}
          recipeCount={authorState.author.recipeCount}
          isOwner={authorState.author.isOwner}
        />
      ) : null}

      <RecipeMetaCard
        prepTimeMinutes={recipe.prepTimeMinutes}
        cookTimeMinutes={recipe.cookTimeMinutes}
        servings={recipe.servings}
        difficulty={recipe.difficulty}
        recipeId={recipeId}
        recipeName={recipe.name}
      />

      {/* Unconditional: the card itself says when a recipe has no figures.
          Hiding the whole section on missing data made an absent backend value
          look like a broken screen — see NutritionCard's docblock. */}
      <SectionHeader title={t().recipes.nutrition} />
      <NutritionCard
        caloriesPerServing={recipe.caloriesPerServing}
        servings={recipe.servings}
        nutrition={recipe.nutrition}
      />

      {recipe.tags.length > ValueConstants.zero ? (
        <View style={styles.tagsRow}>
          {recipe.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.chipBackground }]}>
              <ThemedText variant="caption" style={{ color: colors.chipText }}>
                {tag}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs2,
  },
  captionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  captionText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  captionRating: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  authorSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  authorSkeletonText: {
    flex: ValueConstants.one,
    gap: spacing.xs2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  tag: {
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.xs,
  },
});
