import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CreatorPlatform } from '@domain/creators/creator-platform';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { avatarSizes, borderWidths, BrandColors, fontSizes, fontWeights, lineHeights, spacing } from '@presentation/base/theme';
import { AvatarImage } from '@presentation/base/widgets/media/avatar-image';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorTagChip } from '@presentation/base/widgets/creators/creator-tag-chip';
import { CreatorProfileMetrics } from '@presentation/app/creators/[userId]/model/creator-profile-metrics';

export interface CreatorProfileHeroProps {
  profile: UserProfileEntity;
}

const FRAME = avatarSizes.frame;
const INNER = avatarSizes.frameInner;
/** The page-coloured gap between the ring and the photo. */
const GAP = borderWidths.thick;
const INSTAGRAM_RING = [BrandColors.instagramGradientStart, BrandColors.instagramGradientMid, BrandColors.instagramGradientEnd] as const;
const TIKTOK_RING = [BrandColors.tiktokCyan, BrandColors.tiktokRed] as const;
const RING_START = { x: ValueConstants.zero, y: ValueConstants.one };
const RING_END = { x: ValueConstants.one, y: ValueConstants.zero };

/**
 * The top of a creator's page: the avatar in its platform's ring, the name,
 * the verified handle chip and the bio.
 *
 * @remarks
 * - **The ring wears the platform's colours** — Instagram's gradient, TikTok's
 *   cyan-to-red — and the app's own gradient for someone with no tag.
 * - **The bio is `textSubtle`** and capped to a reading measure.
 */
export const CreatorProfileHero = ({ profile }: CreatorProfileHeroProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const tag = profile.creator;
  const ring =
    tag === null
      ? ([colors.primaryGradientStart, colors.primaryGradientEnd] as const)
      : tag.platform === CreatorPlatform.TikTok
        ? TIKTOK_RING
        : INSTAGRAM_RING;

  return (
    <View style={styles.hero}>
      <LinearGradient colors={ring} start={RING_START} end={RING_END} style={styles.ring}>
        <View style={[styles.gap, { borderColor: colors.background, backgroundColor: colors.background }]}>
          <AvatarImage uri={profile.photoUrl ?? undefined} name={profile.displayName} size={INNER - GAP * ValueConstants.two} />
        </View>
      </LinearGradient>
      <View style={styles.identity}>
        <SizedText size={fontSizes.title} weight={fontWeights.heavy} accessibilityRole="header" style={styles.centred}>
          {profile.displayName}
        </SizedText>
        {tag !== null ? <CreatorTagChip tag={tag} /> : null}
      </View>
      {profile.bio !== null && profile.bio.trim().length > ValueConstants.zero ? (
        <SizedText size={fontSizes.medium} ratio={lineHeights.normal} color={colors.textSubtle} style={[styles.centred, styles.bio]}>
          {profile.bio}
        </SizedText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  ring: {
    width: FRAME,
    height: FRAME,
    borderRadius: FRAME / ValueConstants.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gap: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / ValueConstants.two,
    borderWidth: GAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    alignItems: 'center',
    gap: spacing.xs2,
  },
  centred: {
    textAlign: 'center',
  },
  bio: {
    maxWidth: CreatorProfileMetrics.bioMaxWidth,
  },
});
