import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, mediaSizes, decorSizes, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { HERO_OVERLAY_DEEP, HERO_OVERLAY_FADE } from '@presentation/app/recipes/model/hero/web-hero-constants';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { ValueConstants } from '@core/constants';

export interface WebHeroMiniCardProps {
  recipe: RecipeSummaryEntity;
  /** Rank number rendered in the top-left badge (2 or 3). */
  rank: number;
  onPress: (id: string) => void;
}

/** Compact ranked hero card: bleed image, bottom gradient, rank badge, meta. */
export const WebHeroMiniCard = ({ recipe, rank, onPress }: WebHeroMiniCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const totalMin = recipe.totalTimeMinutes;
  return (
    <Pressable
      onPress={() => onPress(recipe.id)}
      accessibilityRole="button"
      accessibilityLabel={recipe.name}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <RecipeImage
        uri={recipe.image}
        style={styles.image}
        accessibilityLabel={recipe.name}
        placeholderLabel={t().recipes.noPhoto}
      />
      <LinearGradient
        colors={[HERO_OVERLAY_FADE, HERO_OVERLAY_DEEP]}
        start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
        end={{ x: ValueConstants.zero, y: ValueConstants.one }}
        style={styles.gradient}
      />
      <View style={[styles.rankBadge, { backgroundColor: colors.onOverlay }]}>
        <ThemedText style={[styles.rankText, { color: colors.heroButtonText }]}>
          {String(rank)}
        </ThemedText>
      </View>
      <View style={styles.content}>
        <ThemedText numberOfLines={2} style={[styles.title, { color: colors.onOverlay }]}>
          {recipe.name}
        </ThemedText>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={iconSizes.md} color={colors.starFilled} />
          <ThemedText style={[styles.meta, { color: colors.onOverlay }]}>
            {recipe.rating.toFixed(1)}
          </ThemedText>
          <Ionicons name="time-outline" size={iconSizes.md} color={colors.onOverlay} />
          <ThemedText style={[styles.meta, { color: colors.onOverlay }]}>
            {totalMin} {t().recipes.minutes}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: ValueConstants.one,
    minHeight: mediaSizes.heroMiniMinHeight,
    borderRadius: radii.xxl,
    overflow: 'hidden',
  },
  pressed: {
    opacity: opacities.pressedFaint,
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
    bottom: ValueConstants.zero,
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    height: '60%',
  },
  rankBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: decorSizes.rankBadge,
    height: decorSizes.rankBadge,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.body,
  },
  content: {
    position: 'absolute',
    bottom: ValueConstants.zero,
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.heading,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  meta: {
    fontSize: fontSizes.small,
  },
});
