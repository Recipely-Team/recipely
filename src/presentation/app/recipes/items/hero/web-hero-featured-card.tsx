import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, lineHeights, lineHeightFor, letterSpacings, iconSizes, opacities, aspectRatios } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import { difficultyLabel } from '@presentation/base/taxonomy/difficulty-label';
import { WebHeroActionRow } from '@presentation/app/recipes/items/hero/web-hero-action-row';
import {
  HERO_OVERLAY_DEEP,
  HERO_OVERLAY_MID,
  HERO_OVERLAY_FADE,
} from '@presentation/app/recipes/model/hero/web-hero-constants';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { ValueConstants } from '@core/constants';
import { HeroGradientConstants } from '@presentation/app/recipes/model/hero/hero-gradient-constants';

export interface WebHeroFeaturedCardProps {
  recipe: RecipeSummaryEntity;
  onPress: (id: string) => void;
  /** When provided, renders the cosmetic frosted "Save" button. */
  onSave?: (id: string) => void;
  savedByMe?: boolean;
}

/** Large featured hero card: bleed image, diagonal overlay, title + actions. */
export const WebHeroFeaturedCard = ({
  recipe,
  onPress,
  onSave,
  savedByMe = false,
}: WebHeroFeaturedCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const totalMin = recipe.totalTimeMinutes;
  return (
    <View style={styles.card}>
      <RecipeImage
        uri={recipe.image}
        style={styles.image}
        accessibilityLabel={recipe.name}
        placeholderLabel={t().recipes.noPhoto}
      />
      <LinearGradient
        colors={[HERO_OVERLAY_DEEP, HERO_OVERLAY_MID, HERO_OVERLAY_FADE, HERO_OVERLAY_FADE]}
        locations={HeroGradientConstants.locations}
        start={HeroGradientConstants.start}
        end={HeroGradientConstants.end}
        style={styles.gradient}
      />
      {/* Full-bleed open overlay rendered BEFORE content so it sits below it
          in z-order. content is pointerEvents="box-none" so empty areas fall
          through to this overlay while the action-row buttons (real <button>s
          in content) stay on top — and are DOM siblings, never nested. */}
      <Pressable
        onPress={() => onPress(recipe.id)}
        accessibilityRole="button"
        accessibilityLabel={recipe.name}
        style={({ pressed }) => [styles.openOverlay, pressed ? styles.pressed : null]}
      />
      <View style={styles.content} pointerEvents="box-none">
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Ionicons name="flame" size={iconSizes.md} color={colors.primaryText} />
          <ThemedText style={[styles.badgeText, { color: colors.primaryText }]}>
            {upperCase(t().recipes.trending)}
          </ThemedText>
        </View>

        <ThemedText
          numberOfLines={3}
          style={[styles.title, { color: colors.onOverlay, textShadowColor: colors.overlayLight }]}
        >
          {recipe.name}
        </ThemedText>

        <View style={styles.metaRow}>
          <Ionicons name="star" size={iconSizes.md} color={colors.starFilled} />
          <ThemedText style={[styles.meta, { color: colors.onOverlay }]}>
            {recipe.rating.toFixed(1)}
          </ThemedText>
          {totalMin === null ? null : (
            <>
              <Ionicons name="time-outline" size={iconSizes.md} color={colors.onOverlay} />
              <ThemedText style={[styles.meta, { color: colors.onOverlay }]}>
                {t().recipes.heroTotalMin.replace('{n}', String(totalMin))}
              </ThemedText>
            </>
          )}
          <Ionicons name="speedometer-outline" size={iconSizes.md} color={colors.onOverlay} />
          <ThemedText style={[styles.meta, { color: colors.onOverlay }]}>
            {difficultyLabel(recipe.difficulty)}
          </ThemedText>
        </View>

        <WebHeroActionRow
          onView={() => onPress(recipe.id)}
          onSave={onSave !== undefined ? () => onSave(recipe.id) : undefined}
          savedByMe={savedByMe}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Ratio-sized, not height-pinned. The card takes its width from the row's
  // flex, so a pinned height made the shape a function of the window: at 2000px
  // the hero was a 2.8:1 letterbox strip with the photo cropped to a band, and
  // it squared up again as the window narrowed. The max-height keeps it from
  // eating the fold once the content cap hands it a wide column.
  card: {
    aspectRatio: aspectRatios.heroWide,
    borderRadius: radii.xxl2,
    overflow: 'hidden',
  },
  openOverlay: StyleSheet.absoluteFillObject,
  pressed: {
    opacity: opacities.onMediaFaint,
  },
  image: {
    position: 'absolute',
    top: ValueConstants.zero,
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    bottom: ValueConstants.zero,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    top: ValueConstants.zero,
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    bottom: ValueConstants.zero,
  },
  content: {
    position: 'absolute',
    bottom: ValueConstants.zero,
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    padding: spacing.xxxl,
    gap: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs2,
  },
  badgeText: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
  },
  title: {
    fontSize: fontSizes.hero,
    fontWeight: fontWeights.heavy,
    lineHeight: lineHeightFor(fontSizes.hero, lineHeights.solid),
    letterSpacing: letterSpacings.ultraTight,
    textShadowOffset: { width: ValueConstants.zero, height: ValueConstants.two },
    textShadowRadius: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  meta: {
    fontSize: fontSizes.medium,
  },
});
