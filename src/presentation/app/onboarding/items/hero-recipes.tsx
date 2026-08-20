import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, iconSizes } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';
import { OnboardingReveal } from '@presentation/app/onboarding/items/onboarding-reveal';
import type { HeroProps } from '@presentation/app/onboarding/model/hero-props';

const STAR_COUNT = 5;
const ICON_TILE = 56;
const CARD_WIDTH = 232;
const STAGGER_MS = 110;

interface MockRecipe {
  title: string;
  meta: string;
  stars: number;
}

const MiniStars = ({ filled }: { filled: number }): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.stars}>
      {Array.from({ length: STAR_COUNT }).map((_, i) => (
        <Ionicons
          key={i}
          name="star"
          size={fontSizes.micro}
          color={i < filled ? colors.starFilled : colors.starEmpty}
        />
      ))}
    </View>
  );
};

const RecipeCard = ({ recipe }: { recipe: MockRecipe }): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View
      style={[
        styles.card,
        shadows.lg,
        { backgroundColor: colors.surface, borderColor: colors.cardBorder },
      ]}
    >
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        style={styles.iconTile}
      >
        <Ionicons name="restaurant" size={iconSizes.xxl} color={colors.onOverlay} />
      </LinearGradient>
      <View style={styles.cardBody}>
        <ThemedText numberOfLines={ValueConstants.one} style={styles.cardTitle}>
          {recipe.title}
        </ThemedText>
        <ThemedText muted style={styles.cardMeta}>
          {recipe.meta}
        </ThemedText>
        <MiniStars filled={recipe.stars} />
      </View>
      <Ionicons name="bookmark" size={iconSizes.md} color={colors.primary} />
    </View>
  );
};

/** Floating "browse recipes" illustration: a search pill above two recipe cards. */
export const HeroRecipes = ({ active = true }: HeroProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const m = t().onboarding.mock;
  const recipes: MockRecipe[] = [
    { title: m.recipeOneTitle, meta: m.recipeOneMeta, stars: STAR_COUNT },
    { title: m.recipeTwoTitle, meta: m.recipeTwoMeta, stars: STAR_COUNT - ValueConstants.one },
  ];

  return (
    <View style={styles.root}>
      <OnboardingReveal active={active}>
        <View
          style={[
            styles.searchPill,
            shadows.lg,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons name="search" size={iconSizes.md} color={colors.primary} />
          <ThemedText muted style={styles.searchText}>
            {m.searchPlaceholder}
          </ThemedText>
        </View>
      </OnboardingReveal>
      {recipes.map((recipe, i) => (
        <OnboardingReveal key={recipe.title} active={active} delay={(i + ValueConstants.one) * STAGGER_MS}>
          <RecipeCard recipe={recipe} />
        </OnboardingReveal>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
    transform: [{ rotate: '-3deg' }],
  },
  searchPill: {
    width: CARD_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  card: {
    width: CARD_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm2,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconTile: {
    width: ICON_TILE,
    height: ICON_TILE,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
    gap: spacing.xxs,
  },
  cardTitle: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.heavy,
    letterSpacing: letterSpacings.tight,
  },
  cardMeta: {
    fontSize: fontSizes.micro,
  },
  stars: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
});
