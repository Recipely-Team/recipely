import { Pressable, StyleSheet, View } from 'react-native';
import { isWeb } from '@infrastructure/constants/platform';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { difficultyLabel } from '@presentation/base/taxonomy/difficulty-label';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontSizes, fontWeights, lineHeights, lineHeightFor, iconSizes, controlSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { ValueConstants } from '@core/constants';

const HOVER_LIFT = 1.02;
const HOVER_DURATION = 160;

export interface WebRecipeCardProps {
  recipe: RecipeSummaryEntity;
  /** True when the recipe is in the signed-in user's saved set. */
  saved: boolean;
  onOpen: (id: string) => void;
  /** Toggles the saved state; the bookmark button never opens the card. */
  onToggleSave: (id: string) => void;
  /** Optional "Yours" badge for the My Recipes "Created" tab. */
  ownedByMe?: boolean;
}

/**
 * Faithful web recipe card from the Claude Design prototype: 4:3 cover image
 * with a translucent cuisine tag (top-left) and a circular save bookmark
 * (top-right), a 2-line title, a time + difficulty meta row, and a footer
 * (top border) showing star/rating left and heart/likes right. Web-only:
 * lifts slightly on hover. No author row (that would be an N+1 fetch).
 */
export const WebRecipeCard = ({
  recipe, saved, onOpen, onToggleSave, ownedByMe = false,
}: WebRecipeCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { cuisineLabel } = useTaxonomyLabel();
  const scale = useSharedValue(ValueConstants.one);
  const totalMin = recipe.totalTimeMinutes;

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const hoverProps =
    isWeb()
      ? {
          onMouseEnter: () => {
            scale.value = withTiming(HOVER_LIFT, { duration: HOVER_DURATION });
          },
          onMouseLeave: () => {
            scale.value = withTiming(1, { duration: HOVER_DURATION });
          },
        }
      : {};

  return (
    <Animated.View style={animatedStyle}>
      <View
        {...hoverProps}
        style={[styles.card, shadows.md, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
      >
        {/* Open pressable wraps everything EXCEPT the save bookmark, so the
            save button is a DOM sibling — never a nested <button> on web. */}
        <Pressable
          onPress={() => onOpen(recipe.id)}
          accessibilityRole="button"
          accessibilityLabel={recipe.name}
        >
          <View style={styles.imageWrap}>
            <RecipeImage
              uri={recipe.image}
              style={styles.image}
              accessibilityLabel={recipe.name}
              placeholderLabel={t().recipes.noPhoto}
            />
            <View style={[styles.cuisineTag, { backgroundColor: colors.overlay }]}>
              <ThemedText variant="caption" style={[styles.cuisineText, { color: colors.onOverlay }]}>
                {cuisineLabel(recipe.cuisine).name}
              </ThemedText>
            </View>
            {ownedByMe ? (
              <View style={[styles.ownedBadge, { backgroundColor: colors.primary }]}>
                <ThemedText variant="caption" style={[styles.ownedText, { color: colors.primaryText }]}>
                  {t().recipes.youPill}
                </ThemedText>
              </View>
            ) : null}
          </View>

          <View style={styles.body}>
            <ThemedText variant="subtitle" numberOfLines={2} style={styles.title}>
              {recipe.name}
            </ThemedText>
            <View style={styles.metaRow}>
              {totalMin === null ? null : (
                <>
                  <Ionicons name="time-outline" size={iconSizes.md} color={colors.textMuted} />
                  <ThemedText variant="caption" muted>
                    {t().recipes.heroTotalMin.replace('{n}', String(totalMin))}
                  </ThemedText>
                </>
              )}
              <Ionicons name="speedometer-outline" size={iconSizes.md} color={colors.textMuted} />
              <ThemedText variant="caption" muted>
                {difficultyLabel(recipe.difficulty)}
              </ThemedText>
            </View>

            <View style={[styles.footer, { borderTopColor: colors.cardBorder }]}>
              <View style={styles.footerItem}>
                <MaterialCommunityIcons name="star" size={iconSizes.md} color={colors.starFilled} />
                <ThemedText variant="caption" style={{ color: colors.text }}>
                  {recipe.rating.toFixed(1)}
                </ThemedText>
              </View>
              <View style={styles.footerItem}>
                <MaterialCommunityIcons
                  name={recipe.likedByMe ? 'heart' : 'heart-outline'}
                  size={iconSizes.md}
                  color={recipe.likedByMe ? colors.likeActive : colors.textMuted}
                />
                <ThemedText variant="caption" muted>
                  {recipe.likeCount}
                </ThemedText>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Sibling of the open pressable; absolutely positioned over the
            image's top-right corner (image is flush to the card top/right). */}
        <Pressable
          onPress={() => onToggleSave(recipe.id)}
          accessibilityRole="button"
          accessibilityLabel={saved ? t().recipes.saved : t().recipes.save}
          hitSlop={spacing.sm}
          style={[styles.saveBtn, { backgroundColor: colors.overlay }]}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={iconSizes.md}
            color={colors.onOverlay}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  imageWrap: {
    aspectRatio: 4 / 3,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cuisineTag: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.xs,
  },
  cuisineText: {
    fontWeight: fontWeights.semibold,
  },
  ownedBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.xs,
  },
  ownedText: {
    fontWeight: fontWeights.bold,
  },
  saveBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: controlSizes.iconBtnSm,
    height: controlSizes.iconBtnSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    minHeight: lineHeightFor(fontSizes.subtitle, lineHeights.snug) * ValueConstants.two,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
