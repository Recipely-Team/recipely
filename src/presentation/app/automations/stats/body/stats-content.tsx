import { StyleSheet, View } from 'react-native';
import type { CreatorStats } from '@domain/instagram/stats/creator-stats';
import { FunnelStrip } from '@presentation/app/automations/stats/body/funnel-strip';
import { DailyChart } from '@presentation/app/automations/stats/body/daily-chart';
import { FollowersCard } from '@presentation/app/automations/stats/body/followers-card';
import { PostsSection } from '@presentation/app/automations/stats/body/posts-section';
import { StatsMetrics } from '@presentation/app/automations/stats/model/stats-metrics';
import { spacing } from '@presentation/base/theme';

export interface StatsContentProps {
  stats: CreatorStats;
  contentWidth: number;
  onOpenPost: (ruleId: string) => void;
}

/**
 * The loaded panel (spec "Layout"): funnel, then chart and followers side by
 * side from 720 wide (stacked below), then the posts — a table when wide.
 */
export const StatsContent = ({ stats, contentWidth, onOpenPost }: StatsContentProps): React.JSX.Element => {
  const isWide = contentWidth >= StatsMetrics.wideMinWidth;
  return (
    <View style={styles.stack}>
      <FunnelStrip stats={stats} inRow={contentWidth >= StatsMetrics.funnelRowMinWidth} wide={isWide} />
      <View style={isWide ? styles.pair : styles.stack}>
        <View style={isWide ? styles.chart : undefined}>
          <DailyChart days={stats.daily} wide={isWide} />
        </View>
        <View style={isWide ? styles.followers : undefined}>
          <FollowersCard stats={stats} wide={isWide} />
        </View>
      </View>
      <PostsSection posts={stats.posts} wide={isWide} onOpen={onOpenPost} />
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.xl },
  pair: { flexDirection: 'row', gap: spacing.lg, alignItems: 'stretch' },
  chart: { flex: StatsMetrics.chartShare },
  followers: { flex: StatsMetrics.followersShare },
});
