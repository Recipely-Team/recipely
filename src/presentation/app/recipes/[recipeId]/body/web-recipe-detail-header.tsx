import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { AvatarImage } from '@presentation/base/widgets/media/avatar-image';
import { difficultyLabel } from '@presentation/base/taxonomy/difficulty-label';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import type { RecipeAuthorState } from '@presentation/app/recipes/[recipeId]/model/author/recipe-author-state';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, iconSizes, controlSizes, avatarSizes, borderWidths, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { ValueConstants } from '@core/constants';

export interface WebRecipeDetailHeaderProps {
  recipe: RecipeEntity;
  authorState: RecipeAuthorState;
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isSaved: boolean;
  saveDisabled: boolean;
  onToggleSave: () => void;
}

/**
 * Web recipe-detail header: a chip row (cuisine + difficulty), an h1-style
 * title, an author/stats row, and the owner Edit + Save action pills. Replaces
 * the mobile floating circle button cluster on the web shell.
 *
 * The like button is always pressable regardless of auth state — a guest tap
 * is caught by `onToggleLike` (wired to `useGuestGate` in the parent screen),
 * which opens a sign-in prompt instead of running the toggle.
 */
export const WebRecipeDetailHeader = ({
  recipe,
  authorState,
  liked,
  likeCount,
  onToggleLike,
  isOwner,
  onEdit,
  onDelete,
  isSaved,
  saveDisabled,
  onToggleSave,
}: WebRecipeDetailHeaderProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { cuisineLabel } = useTaxonomyLabel();
  const author = authorState.status === 'resolved' ? authorState.author : null;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.chipRow}>
          {recipe.cuisine.length > ValueConstants.zero ? (
            <View style={[styles.chip, { backgroundColor: colors.chipBackground }]}>
              <ThemedText variant="caption" style={[styles.chipText, { color: colors.chipText }]}>
                {cuisineLabel(recipe.cuisine).name}
              </ThemedText>
            </View>
          ) : null}
          <View
            style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderWidth: ValueConstants.one }]}
          >
            <ThemedText variant="caption" style={[styles.chipText, { color: colors.textMuted }]}>
              {difficultyLabel(recipe.difficulty)}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={[styles.title, { color: colors.text }]}>{recipe.name}</ThemedText>

        <View style={styles.statsRow}>
          {author !== null ? (
            <View style={styles.statItem}>
              <AvatarImage
                uri={author.authorPhotoUrl}
                name={author.authorName}
                size={avatarSizes.xs}
              />
              <ThemedText variant="body" style={styles.authorName}>
                {author.authorName}
              </ThemedText>
            </View>
          ) : null}
          {recipe.rating > ValueConstants.zero ? (
            <View style={styles.statItem}>
              <Ionicons name="star" size={iconSizes.md} color={colors.starFilled} />
              <ThemedText variant="body" style={[styles.statText, { color: colors.text }]}>
                {recipe.rating.toFixed(1)}
              </ThemedText>
            </View>
          ) : null}
          <Pressable
            onPress={onToggleLike}
            accessibilityRole="button"
            accessibilityLabel={liked ? t().recipes.unlike : t().recipes.like}
            style={styles.statItem}
          >
            <MaterialCommunityIcons
              name={liked ? 'heart' : 'heart-outline'}
              size={iconSizes.xl}
              color={liked ? colors.likeActive : colors.textMuted}
            />
            <ThemedText
              variant="body"
              style={[styles.statText, { color: liked ? colors.likeActive : colors.textMuted }]}
            >
              {String(likeCount)}
            </ThemedText>
          </Pressable>
          {recipe.viewCount > ValueConstants.zero ? (
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={iconSizes.xl} color={colors.textMuted} />
              <ThemedText variant="body" style={[styles.statText, { color: colors.textMuted }]}>
                {recipe.viewCount.toLocaleString()}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        {isOwner ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t().myRecipes.editRecipe}
            onPress={onEdit}
            style={({ pressed }) => [
              styles.pill,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder, opacity: pressed ? opacities.pressed : opacities.full },
            ]}
          >
            <Ionicons name="create-outline" size={iconSizes.md} color={colors.text} />
            <ThemedText variant="caption" style={[styles.pillLabel, { color: colors.text }]}>
              {t().myRecipes.editRecipe}
            </ThemedText>
          </Pressable>
        ) : null}
        {isOwner ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t().myRecipes.deleteRecipe}
            onPress={onDelete}
            style={({ pressed }) => [
              styles.pill,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder, opacity: pressed ? opacities.pressed : opacities.full },
            ]}
          >
            <Ionicons name="trash-outline" size={iconSizes.md} color={colors.danger} />
            <ThemedText variant="caption" style={[styles.pillLabel, { color: colors.danger }]}>
              {t().myRecipes.deleteRecipe}
            </ThemedText>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isSaved ? t().recipes.saved : t().recipes.save}
          onPress={onToggleSave}
          disabled={saveDisabled}
          style={({ pressed }) => [
            styles.pill,
            isSaved
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            { opacity: pressed || saveDisabled ? opacities.pressed : opacities.full },
          ]}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={iconSizes.md}
            color={isSaved ? colors.primaryText : colors.text}
          />
          <ThemedText
            variant="caption"
            style={[styles.pillLabel, { color: isSaved ? colors.primaryText : colors.text }]}
          >
            {isSaved ? t().recipes.saved : t().recipes.save}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  left: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
    gap: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: {
    fontWeight: fontWeights.semibold,
  },
  title: {
    fontSize: fontSizes.jumbo,
    fontWeight: fontWeights.heavy,
    lineHeight: fontSizes.jumbo + spacing.xs,
    letterSpacing: letterSpacings.ultraTight,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorName: {
    fontWeight: fontWeights.semibold,
  },
  statText: {
    fontWeight: fontWeights.semibold,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
    minHeight: controlSizes.searchBar,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  pillLabel: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.caption,
  },
});
