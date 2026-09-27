import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { provenanceSealMetrics } from '@presentation/base/widgets/badges/provenance-seal-metrics';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { RecipeStatusBadge } from '@presentation/base/widgets/badges/recipe-status-badge';
import { cardCoverScrim } from '@presentation/base/widgets/cards/card-cover-scrim';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { BrandColors } from '@presentation/base/theme/colors/palette/brand-colors';
import { aspectRatios, fontWeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { ProvenanceMarkType } from '@domain/recipes/provenance/provenance-mark';
import type { OwnerStatusType } from '@domain/recipes/publishing/owner-status';

export interface RecipeCardCoverProps {
  name: string;
  image: string;
  cuisine: string;
  difficulty: string;
  provenance: readonly ProvenanceMarkType[];
  ownerStatus?: OwnerStatusType;
}

/**
 * A phone card's cover: the recipe's first photo at 16:10, cropped centred,
 * with difficulty top-left, the seal and cuisine top-right, and — on the
 * Created tab — the status bottom-left, so the top corners stay uncovered.
 *
 * The portrait rule of the detail hero does not apply here: a card is a
 * thumbnail, and a grid of letterboxed covers would stop reading as a grid.
 */
export const RecipeCardCover = ({
  name, image, cuisine, difficulty, provenance, ownerStatus,
}: RecipeCardCoverProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.cover, { backgroundColor: colors.skeleton }]}>
      <RecipeImage uri={image} style={styles.image} accessibilityLabel={name} placeholderLabel={t().recipes.noPhoto} />
      <LinearGradient
        pointerEvents="none"
        colors={[BrandColors.photoScrimClear, colors.overlay]}
        locations={cardCoverScrim.locations}
        start={cardCoverScrim.start}
        end={cardCoverScrim.end}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topRight}>
        <ProvenanceSeal marks={provenance} surface={SealSurface.Photo} size={provenanceSealMetrics.cardSize} />
        <View style={[styles.chip, { backgroundColor: colors.primary }]}>
          <ThemedText variant="caption" style={[styles.chipText, { color: colors.primaryText }]}>{cuisine}</ThemedText>
        </View>
      </View>
      <View style={[styles.chip, styles.topLeft, { backgroundColor: colors.overlay }]}>
        <ThemedText variant="caption" style={[styles.chipText, { color: colors.onOverlay }]}>{difficulty}</ThemedText>
      </View>
      {ownerStatus !== undefined ? <RecipeStatusBadge status={ownerStatus} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  cover: {
    aspectRatio: aspectRatios.heroWide,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topRight: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
  },
  topLeft: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  chip: {
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.xs,
  },
  chipText: {
    fontWeight: fontWeights.semibold,
  },
});
