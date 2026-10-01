import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, fontSizes, fontWeights, lineHeights, spacing } from '@presentation/base/theme';
import { AvatarImage } from '@presentation/base/widgets/media/avatar-image';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorTagChip } from '@presentation/base/widgets/creators/creator-tag-chip';
import { CreatorProfileMetrics } from '@presentation/app/creators/[userId]/model/creator-profile-metrics';

export interface CreatorProfileHeroProps {
  profile: UserProfileEntity;
  /** The expanded viewport's larger avatar and name. */
  expanded: boolean;
}

/** The ring and the page-coloured gap inside it, each this wide. */
const BAND = borderWidths.medium;
/** The prototype's 135° sweep: start colour top-left, end colour bottom-right. */
const RING_START = { x: ValueConstants.zero, y: ValueConstants.zero };
const RING_END = { x: ValueConstants.one, y: ValueConstants.one };

/**
 * The top of a creator's page: the avatar in the app's gradient ring (104 on a
 * phone, 128 expanded), the name (24/800, 30/800), the verified platform badge
 * and the bio (design spec → Creators §6.1–6.4).
 *
 * @remarks
 * - **The ring is the app's `primaryGradient`** for every creator; the
 *   platform is named by the badge under the name, not by the ring.
 * - **The bio is `text`**, 14/1.5, capped at a 340 reading measure.
 */
export const CreatorProfileHero = ({ profile, expanded }: CreatorProfileHeroProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const outer = expanded ? CreatorProfileMetrics.avatarExpanded : CreatorProfileMetrics.avatar;
  const gap = outer - BAND * ValueConstants.two;
  const photo = gap - BAND * ValueConstants.two;
  const tag = profile.creator;

  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        start={RING_START}
        end={RING_END}
        style={[styles.centre, { width: outer, height: outer, borderRadius: outer / ValueConstants.two }]}
      >
        <View style={[styles.centre, { width: gap, height: gap, borderRadius: gap / ValueConstants.two, backgroundColor: colors.background }]}>
          <AvatarImage uri={profile.photoUrl ?? undefined} name={profile.displayName} size={photo} />
        </View>
      </LinearGradient>
      <SizedText
        size={expanded ? fontSizes.largeTitle : fontSizes.title}
        weight={fontWeights.heavy}
        accessibilityRole="header"
        style={[styles.centred, styles.name]}
      >
        {profile.displayName}
      </SizedText>
      {tag !== null ? (
        <View style={styles.badge}>
          <CreatorTagChip tag={tag} />
        </View>
      ) : null}
      {profile.bio !== null && profile.bio.trim().length > ValueConstants.zero ? (
        <SizedText size={fontSizes.medium} ratio={lineHeights.normal} color={colors.text} style={[styles.centred, styles.bio]}>
          {profile.bio}
        </SizedText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  centre: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: spacing.md,
  },
  badge: {
    marginTop: spacing.sm,
  },
  centred: {
    textAlign: 'center',
  },
  bio: {
    marginTop: spacing.sm,
    maxWidth: CreatorProfileMetrics.bioMaxWidth,
  },
});
