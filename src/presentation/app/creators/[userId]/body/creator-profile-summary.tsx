import { StyleSheet, View } from 'react-native';
import type { ViewedUserProfile } from '@domain/user-profile/viewed-user-profile';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PillButton } from '@presentation/base/widgets/buttons/pill-button';
import { PillButtonTone } from '@presentation/base/widgets/buttons/pill-button-tone';
import { t } from '@presentation/i18n';
import { CreatorProfileHero } from '@presentation/app/creators/[userId]/body/creator-profile-hero';
import { CreatorProfileStats } from '@presentation/app/creators/[userId]/body/creator-profile-stats';
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
 * - **Follow is the primary pill; Following the outline one**, so the state
 *   reads at a glance and unfollowing is the quieter action.
 * - **The button names the creator for assistive tech** ("Follow, Ayşe").
 */
export const CreatorProfileSummary = ({ viewed, vm }: CreatorProfileSummaryProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { profile } = viewed;
  const followLabel = viewed.isFollowedByMe ? t().creators.following : t().creators.follow;

  return (
    <View>
      <CreatorProfileHero profile={profile} />
      <View style={styles.capped}>
        <CreatorProfileStats
          recipeCount={profile.recipeCount}
          followerCount={viewed.followerCount}
          likeCount={profile.totalLikes}
          formatCount={vm.formatCount}
        />
        {vm.isOwnProfile ? null : (
          <View style={styles.follow}>
            <PillButton
              label={followLabel}
              accessibilityLabel={`${followLabel}, ${profile.displayName}`}
              tone={viewed.isFollowedByMe ? PillButtonTone.Outline : PillButtonTone.Primary}
              disabled={vm.isFollowPending}
              onPress={vm.onToggleFollow}
            />
          </View>
        )}
      </View>
      <View style={styles.heading}>
        <SizedText size={fontSizes.subtitle} weight={fontWeights.bold} accessibilityRole="header">
          {t().creators.recipesTitle}
        </SizedText>
        <SizedText size={fontSizes.small} color={colors.textSubtle}>
          {t().creators.recipeCount.replace('{n}', vm.formatCount(profile.recipeCount))}
        </SizedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  capped: {
    width: '100%',
    maxWidth: CreatorProfileMetrics.summaryMaxWidth,
    alignSelf: 'center',
  },
  follow: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    paddingHorizontal: CreatorProfileMetrics.gutter,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: CreatorProfileMetrics.gutter,
  },
});
