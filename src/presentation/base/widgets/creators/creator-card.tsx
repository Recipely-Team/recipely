import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { avatarSizes, borderWidths, fontSizes, fontWeights, opacities, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { t } from '@presentation/i18n';
import { CreatorAvatar } from '@presentation/base/widgets/creators/creator-avatar';
import { creatorItemLabel } from '@presentation/base/widgets/creators/creator-item-label';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
import { CreatorCardSize, type CreatorCardSizeType } from '@presentation/base/widgets/creators/creator-card-size';

export interface CreatorCardProps {
  creator: CreatorSummaryEntity;
  size: CreatorCardSizeType;
  onOpen: (id: string) => void;
}

/**
 * A creator as a card: avatar with the platform mark, name, handle and how
 * many recipes they have. The /creators grid on a phone uses the compact
 * card; the expanded viewport's grid (Explore and /creators) the wide one.
 *
 * @remarks
 * - **Secondary lines are `textSubtle`**, which reads at AA on the card's
 *   `surface` in every palette.
 * - **The name wraps to two lines** rather than truncating a short card's
 *   only identifying word.
 */
const CreatorCardComponent = ({ creator, size, onOpen }: CreatorCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const wide = size === CreatorCardSize.Wide;
  const count = t().creators.recipeCount.replace('{n}', String(creator.recipeCount));

  return (
    <Pressable
      onPress={() => onOpen(creator.id)}
      accessibilityRole="button"
      accessibilityLabel={creatorItemLabel(creator)}
      style={({ pressed }) => [
        styles.card,
        wide ? styles.wide : styles.compact,
        { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        { opacity: pressed ? opacities.pressedSubtle : opacities.full },
      ]}
    >
      <CreatorAvatar
        name={creator.displayName}
        photoUrl={creator.photoUrl}
        platform={creator.creator.platform}
        size={wide ? avatarSizes.xl : avatarSizes.creatorCard}
        markSize={wide ? creatorMarkGeometry.wideCard : creatorMarkGeometry.card}
        groundColor={colors.surface}
      />
      <SizedText size={fontSizes.medium} weight={fontWeights.bold} numberOfLines={ValueConstants.two} style={styles.centred}>
        {creator.displayName}
      </SizedText>
      <SizedText size={fontSizes.small} color={colors.textSubtle} numberOfLines={ValueConstants.one} style={styles.centred}>
        {creator.creator.displayHandle}
      </SizedText>
      <SizedText size={fontSizes.small} color={colors.textSubtle} style={styles.centred}>
        {count}
      </SizedText>
    </Pressable>
  );
};

export const CreatorCard = memo(CreatorCardComponent);

const styles = StyleSheet.create({
  card: {
    flex: ValueConstants.one,
    alignItems: 'center',
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
  compact: {
    gap: spacing.xs2,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  wide: {
    gap: spacing.sm,
    paddingTop: spacing.lg2,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  centred: {
    textAlign: 'center',
  },
});
