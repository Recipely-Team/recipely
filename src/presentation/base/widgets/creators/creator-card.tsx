import { memo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { avatarSizes, borderWidths, fontSizes, fontWeights, opacities, radii, spacing } from '@presentation/base/theme';
import { formatCompactCount } from '@presentation/base/utils/format-compact-count';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { getLocale, t } from '@presentation/i18n';
import { CreatorAvatar } from '@presentation/base/widgets/creators/creator-avatar';
import { creatorItemLabel } from '@presentation/base/widgets/creators/creator-item-label';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';

export interface CreatorCardProps {
  creator: CreatorSummaryEntity;
  onOpen: (id: string) => void;
}

/**
 * A creator as a card, on the /creators grid and the expanded Explore row:
 * 64 avatar with the platform seal, name, `@handle`, and "4 recipes · 184K
 * followers" (design spec → Creators §3, CreatorCard).
 *
 * @remarks
 * - **Secondary lines are `textSubtle`**, which reads at AA on the card in
 *   every palette.
 * - **Lifts on hover** (web): the medium shadow and 2 up, as the recipe cards do.
 */
const CreatorCardComponent = ({ creator, onOpen }: CreatorCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const [hovered, setHovered] = useState(false);
  const caption = t()
    .creators.cardCaption.replace('{recipes}', formatCompactCount(creator.recipeCount, getLocale()))
    .replace('{followers}', formatCompactCount(creator.followerCount, getLocale()));

  return (
    <Pressable
      onPress={() => onOpen(creator.id)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={creatorItemLabel(creator)}
      style={({ pressed }) => [
        styles.card,
        hovered ? [shadows.md, styles.lifted] : shadows.sm,
        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
        { opacity: pressed ? opacities.pressedSubtle : opacities.full },
      ]}
    >
      <CreatorAvatar
        name={creator.displayName}
        photoUrl={creator.photoUrl}
        platform={creator.creator.platform}
        size={avatarSizes.creatorStrip}
        markSize={creatorMarkGeometry.avatar}
        groundColor={colors.cardBackground}
      />
      <SizedText size={fontSizes.body} weight={fontWeights.bold} numberOfLines={ValueConstants.one} style={[styles.line, styles.name]}>
        {creator.displayName}
      </SizedText>
      <SizedText size={fontSizes.caption} color={colors.textSubtle} numberOfLines={ValueConstants.one} style={styles.line}>
        {creator.creator.displayHandle}
      </SizedText>
      <SizedText size={fontSizes.small} color={colors.textSubtle} style={[styles.line, styles.caption]}>
        {caption}
      </SizedText>
    </Pressable>
  );
};

export const CreatorCard = memo(CreatorCardComponent);

const styles = StyleSheet.create({
  card: {
    flex: ValueConstants.one,
    alignItems: 'center',
    paddingTop: spacing.lg2,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
  lifted: {
    transform: [{ translateY: -spacing.xxs }],
  },
  line: {
    width: '100%',
    textAlign: 'center',
  },
  name: {
    marginTop: spacing.sm2,
  },
  caption: {
    marginTop: spacing.xs2,
  },
});
