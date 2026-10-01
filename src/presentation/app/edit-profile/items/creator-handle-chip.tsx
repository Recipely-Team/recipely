import { StyleSheet, View } from 'react-native';
import type { CreatorTag } from '@domain/creators/creator-tag';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';

export interface CreatorHandleChipProps {
  tag: CreatorTag;
}

/**
 * The claimed account while it is in review or was not approved: the same
 * 32-high pill as the verified badge, but neutral — `textSubtle` handle, no
 * check, no link, since nothing has been verified yet.
 */
export const CreatorHandleChip = ({ tag }: CreatorHandleChipProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <CreatorPlatformMark platform={tag.platform} size={creatorMarkGeometry.chip} />
      <SizedText size={fontSizes.caption} weight={fontWeights.semibold} color={colors.textSubtle} numberOfLines={ValueConstants.one}>
        {tag.displayHandle}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs2,
    minHeight: controlSizes.iconBtnSm,
    paddingLeft: spacing.xs,
    paddingRight: spacing.sm2,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
});
