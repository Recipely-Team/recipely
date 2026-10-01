import { StyleSheet, View } from 'react-native';
import type { CreatorPlatformType } from '@domain/creators/creator-platform';
import { ValueConstants } from '@core/constants';
import { borderWidths, spacing } from '@presentation/base/theme';
import { AvatarImage } from '@presentation/base/widgets/media/avatar-image';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
import { creatorPlatformName } from '@presentation/base/widgets/creators/creator-platform-name';
import { t } from '@presentation/i18n';

export interface CreatorAvatarProps {
  name: string;
  photoUrl: string | null;
  /** The verified platforms, primary first: one seal each, at most two. */
  platforms: readonly CreatorPlatformType[];
  size: number;
  markSize: number;
  /** What the avatar sits on; each seal is cut out of it with a halo of this colour. */
  groundColor: string;
}

/** The seal sits 2 off the avatar's corner; its halo reaches 2 further. */
const MARK_OFFSET = -(spacing.xxs + borderWidths.medium);

/**
 * A creator's avatar with their platform seals in the bottom-right corner
 * (design spec → CreatorAvatar, rev 2).
 *
 * @remarks
 * - **Two accounts, two overlapped seals.** The primary sits in the corner and
 *   in front; the second is shifted left by 60 % of a seal and sits behind,
 *   the halo separating them.
 * - **The seals are one image** for assistive tech: "Verified on Instagram and TikTok".
 */
export const CreatorAvatar = ({ name, photoUrl, platforms, size, markSize, groundColor }: CreatorAvatarProps): React.JSX.Element => {
  const [primary] = platforms;
  // Pulls the second seal over the primary until their centres are `shift` apart.
  const overlap = Math.round(markSize * creatorMarkGeometry.overlapShare) - markSize - borderWidths.medium * ValueConstants.two;
  const label =
    platforms.length > ValueConstants.one || primary === undefined
      ? t().creators.verifiedOnBoth
      : t().creators.verifiedOn.replace('{platform}', creatorPlatformName(primary));

  return (
    <View style={{ width: size, height: size }}>
      <AvatarImage uri={photoUrl ?? undefined} name={name} size={size} />
      {primary === undefined ? null : (
        <View accessible accessibilityRole="image" accessibilityLabel={label} style={styles.marks}>
          {/* Drawn back to front: the second account first, so the primary paints over it. */}
          {[...platforms].reverse().map((platform, index, all) => (
            <View key={platform} style={index === all.length - ValueConstants.one ? null : { marginRight: overlap }}>
              <CreatorPlatformMark platform={platform} size={markSize} haloColor={groundColor} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  marks: {
    position: 'absolute',
    right: MARK_OFFSET,
    bottom: MARK_OFFSET,
    flexDirection: 'row',
    zIndex: ValueConstants.one,
  },
});
