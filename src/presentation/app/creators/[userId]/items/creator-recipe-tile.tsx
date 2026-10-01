import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { CharConstants, ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { aspectRatios, borderWidths, fontSizes, fontWeights, opacities, radii, spacing } from '@presentation/base/theme';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatRating } from '@presentation/base/utils/format-rating';
import { CreatorProfileMetrics } from '@presentation/app/creators/[userId]/model/creator-profile-metrics';
import { t } from '@presentation/i18n';

export interface CreatorRecipeTileProps {
  recipe: RecipeSummaryEntity;
  onOpen: (id: string) => void;
}

const STAR = '★';
const META_SEPARATOR = ' · ';

/**
 * One of the creator's recipes on a phone: a square photo with the provenance
 * seal top-right, the name over two lines and "★ 4.7 · 25 min" in `textSubtle`
 * (design spec → Creators §6.8).
 */
const CreatorRecipeTileComponent = ({ recipe, onOpen }: CreatorRecipeTileProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const meta = [
    recipe.rating > ValueConstants.zero ? `${STAR} ${formatRating(recipe.rating)}` : null,
    recipe.totalTimeMinutes === null ? null : t().recipes.heroTotalMin.replace('{n}', String(recipe.totalTimeMinutes)),
  ]
    .filter((part): part is string => part !== null)
    .join(META_SEPARATOR);

  return (
    <Pressable
      onPress={() => onOpen(recipe.id)}
      accessibilityRole="button"
      accessibilityLabel={recipe.name}
      style={({ pressed }) => [styles.tile, { opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
    >
      <View style={[styles.photo, { backgroundColor: colors.skeleton, borderColor: colors.cardBorder }]}>
        <RecipeImage uri={recipe.image} focus={recipe.imageFocus} style={styles.image} placeholderLabel={t().recipes.noPhoto} />
        <View style={styles.seal}>
          <ProvenanceSeal marks={recipe.provenanceMarks} surface={SealSurface.Photo} size={CreatorProfileMetrics.tileSeal} />
        </View>
      </View>
      <SizedText size={fontSizes.caption} weight={fontWeights.bold} numberOfLines={ValueConstants.two}>
        {recipe.name}
      </SizedText>
      {meta === CharConstants.empty ? null : (
        <SizedText size={fontSizes.small} color={colors.textSubtle} numberOfLines={ValueConstants.one}>
          {meta}
        </SizedText>
      )}
    </Pressable>
  );
};

export const CreatorRecipeTile = memo(CreatorRecipeTileComponent);

const styles = StyleSheet.create({
  tile: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
    gap: spacing.xs2,
  },
  photo: {
    aspectRatio: aspectRatios.square,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  seal: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
});
