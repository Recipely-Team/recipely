import { StyleSheet, View } from 'react-native';
import type { ViewedUserProfile } from '@domain/user-profile/viewed-user-profile';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { t } from '@presentation/i18n';
import { CreatorProfileHero } from '@presentation/app/creators/[userId]/body/creator-profile-hero';
import { CreatorProfileStats } from '@presentation/app/creators/[userId]/body/creator-profile-stats';
import { FollowButton } from '@presentation/app/creators/[userId]/items/follow-button';
import { CreatorProfileMetrics } from '@presentation/app/creators/[userId]/model/creator-profile-metrics';
import type { UseCreatorProfileResult } from '@presentation/app/creators/[userId]/model/use-creator-profile-result';

export interface CreatorProfileSummaryProps {
  viewed: ViewedUserProfile;
  vm: UseCreatorProfileResult;
}

/**
 * Everything above the creator's recipe grid: hero, stats, the follow button
 * and the "Recipes" heading with the count.
 *
 * @remarks
 * - **Stats and Follow share one column**: full width on a phone, capped at
 *   460 on an expanded viewport (design spec → Creators §6.5–6.6).
 * - **The button names the creator for assistive tech** ("Follow Ayşe"), through
 *   a `{name}` template so each language places the name itself.
 */
export const CreatorProfileSummary = ({ viewed, vm }: CreatorProfileSummaryProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { isExpanded } = useLayout();
  const { profile } = viewed;
  const followLabel = viewed.isFollowedByMe ? t().creators.following : t().creators.follow;
  const followA11yLabel = (viewed.isFollowedByMe ? t().creators.followingName : t().creators.followName).replace(
    '{name}',
    profile.displayName,
  );

  return (
    <View>
      <CreatorProfileHero profile={profile} expanded={isExpanded} />
      <View style={[styles.column, isExpanded ? styles.capped : null]}>
        <CreatorProfileStats
          recipeCount={profile.recipeCount}
          followerCount={viewed.followerCount}
          likeCount={profile.totalLikes}
          formatCount={vm.formatCount}
        />
        {vm.isOwnProfile ? null : (
          <View style={styles.follow}>
            <FollowButton
              isFollowing={viewed.isFollowedByMe}
              label={followLabel}
              accessibilityLabel={followA11yLabel}
              isPending={vm.isFollowPending}
              onPress={vm.onToggleFollow}
            />
          </View>
        )}
      </View>
      <View style={styles.heading}>
        <SizedText size={isExpanded ? fontSizes.display : fontSizes.subtitle} weight={fontWeights.heavy} accessibilityRole="header">
          {t().creators.recipesTitle}
        </SizedText>
        <SizedText size={fontSizes.medium} color={colors.textSubtle}>
          {t().creators.recipeCount.replace('{n}', vm.formatCount(profile.recipeCount))}
        </SizedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    width: '100%',
    marginTop: spacing.lg,
    paddingHorizontal: CreatorProfileMetrics.gutter,
  },
  capped: {
    maxWidth: CreatorProfileMetrics.summaryMaxWidth,
    alignSelf: 'center',
  },
  follow: {
    marginTop: spacing.md,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: CreatorProfileMetrics.gutter,
  },
});
