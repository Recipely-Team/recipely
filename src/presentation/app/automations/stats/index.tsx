import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import { StatsRange, type StatsRangeType } from '@domain/instagram/stats/stats-range';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import { PageTitle } from '@presentation/base/widgets/head/page-title';
import { SegmentedTabs } from '@presentation/base/widgets/diary/segmented-tabs';
import { InstagramConnectBlock } from '@presentation/base/widgets/instagram/instagram-connect-block';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { failureIcon, failureSeverity } from '@presentation/base/errors/failure-lookups';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { AutomationsBar } from '@presentation/app/automations/shared/items/automations-bar';
import { useCreatorStats } from '@presentation/app/automations/stats/hooks/use-creator-stats';
import { StatsViewKind } from '@presentation/app/automations/stats/model/stats-view-kind';
import { StatsContent } from '@presentation/app/automations/stats/body/stats-content';
import { StatsSkeleton } from '@presentation/app/automations/stats/body/stats-skeleton';
import { StatsEmpty } from '@presentation/app/automations/stats/body/stats-empty';
import { NoSendsCard } from '@presentation/app/automations/stats/body/no-sends-card';
import { FollowersCard } from '@presentation/app/automations/stats/body/followers-card';
import { StatsFootnote } from '@presentation/app/automations/stats/body/stats-footnote';
import { StatsMetrics } from '@presentation/app/automations/stats/model/stats-metrics';
import { fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

const RANGES: readonly StatsRangeType[] = [StatsRange.Week, StatsRange.Month, StatsRange.Quarter];

/**
 * Creator stats (prototype `creator-stats.jsx`): what the creator's
 * comment-to-DM automations brought in over 7, 30 or 90 days — the funnel,
 * the daily chart, the follower trend and every automated post.
 */
export const CreatorStatsScreen = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const vm = useCreatorStats();
  const scrollable = useAssistantScrollable(vm.view === StatsViewKind.Stats);
  const copy = t().creatorStats;
  const ranged = vm.view === StatsViewKind.Stats || vm.view === StatsViewKind.NoSends || vm.view === StatsViewKind.Loading;
  const range = ranged ? (
    <SegmentedTabs
      options={RANGES.map((days) => ({ key: String(days), label: days === StatsRange.Week ? copy.range7 : days === StatsRange.Month ? copy.range30 : copy.range90 }))}
      value={String(vm.range)}
      onChange={(key) => vm.setRange(Number(key) as StatsRangeType)}
    />
  ) : null;

  const body = (): React.JSX.Element => {
    switch (vm.view) {
      case StatsViewKind.Error:
        return vm.failure === null ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <ErrorState icon={failureIcon(vm.failure)} severity={failureSeverity(vm.failure)} title={copy.errorBody} primaryLabel={copy.tryAgain} onPrimary={vm.onRetry} />
        );
      case StatsViewKind.Unavailable:
        return <ErrorState icon="logo-instagram" severity={SeverityType.Neutral} title={t().errors.instagramNotConfigured.title} body={t().errors.instagramNotConfigured.body} />;
      case StatsViewKind.Locked:
        return (
          <View style={styles.locked}>
            <SizedText accessibilityRole="header" size={fontSizes.subtitle} weight={fontWeights.heavy}>
              {copy.locked}
            </SizedText>
            <InstagramConnectBlock phase={vm.phase} onConnect={vm.connect} label={t().instagram.connect} showBody={false} />
          </View>
        );
      case StatsViewKind.Loading:
        return <StatsSkeleton />;
      case StatsViewKind.NoAutomations:
        return <StatsEmpty onCreate={vm.onCreate} />;
      case StatsViewKind.NoSends:
        return vm.stats === null ? (
          <StatsSkeleton />
        ) : (
          <View style={styles.stack}>
            <NoSendsCard days={vm.range} nextRange={vm.nextRange} onRange={vm.setRange} onViewAutomations={vm.onViewAutomations} />
            <View style={styles.followers}>
              <FollowersCard stats={vm.stats} wide={false} />
            </View>
            <StatsFootnote />
          </View>
        );
      case StatsViewKind.Stats:
        return vm.stats === null ? (
          <StatsSkeleton />
        ) : (
          <>
            <StatsContent stats={vm.stats} contentWidth={vm.contentWidth} onOpenPost={vm.onOpenPost} />
            <StatsFootnote />
          </>
        );
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PageTitle subject={copy.title} />
      <AutomationsBar title={copy.title} subtitle={vm.handle} icon="chevron-back" onBack={vm.onBack} />
      <ScrollView {...scrollable} contentContainerStyle={styles.content}>
        {range}
        {body()}
      </ScrollView>
    </View>
  );
};

export default CreatorStatsScreen;

const styles = StyleSheet.create({
  screen: { flex: ValueConstants.one },
  content: { width: '100%', maxWidth: AutomationMetrics.pageMaxWidth, alignSelf: 'center', padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl },
  stack: { gap: spacing.xl },
  followers: { width: '100%', maxWidth: StatsMetrics.noSendsFollowersMaxWidth, alignSelf: 'center' },
  locked: { gap: spacing.lg },
});
