import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { avatarSizes, fontSizes, fontWeights, opacities, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorAvatar } from '@presentation/base/widgets/creators/creator-avatar';
import { creatorItemLabel } from '@presentation/base/widgets/creators/creator-item-label';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';

export interface CreatorStripItemProps {
  creator: CreatorSummaryEntity;
  onOpen: (id: string) => void;
}

/**
 * One creator in the Explore strip, 76 wide: a 64 avatar with the platform
 * seal, then the name (bold) and the handle on one line each.
 *
 * @remarks
 * - **One accessible name for the whole item** — name, platform and handle —
 *   so a screen reader says who, where and which account in one stop.
 * - **The handle is `textSubtle`**, the grey that reads at AA on the page.
 */
const CreatorStripItemComponent = ({ creator, onOpen }: CreatorStripItemProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      onPress={() => onOpen(creator.id)}
      accessibilityRole="button"
      accessibilityLabel={creatorItemLabel(creator)}
      style={({ pressed }) => [styles.item, { opacity: pressed ? opacities.pressed : opacities.full }]}
    >
      <CreatorAvatar
        name={creator.displayName}
        photoUrl={creator.photoUrl}
        platform={creator.creator.platform}
        size={avatarSizes.creatorStrip}
        markSize={creatorMarkGeometry.avatar}
        groundColor={colors.background}
      />
      <SizedText size={fontSizes.small} weight={fontWeights.bold} numberOfLines={ValueConstants.one} style={styles.line}>
        {creator.displayName}
      </SizedText>
      <SizedText size={fontSizes.micro} color={colors.textSubtle} numberOfLines={ValueConstants.one} style={[styles.line, styles.handle]}>
        {creator.creator.displayHandle}
      </SizedText>
    </Pressable>
  );
};

export const CreatorStripItem = memo(CreatorStripItemComponent);

const styles = StyleSheet.create({
  item: {
    width: creatorMarkGeometry.stripItemWidth,
    alignItems: 'center',
    gap: spacing.xs2,
  },
  line: {
    width: '100%',
    textAlign: 'center',
  },
  handle: {
    marginTop: -spacing.xs2,
  },
});
