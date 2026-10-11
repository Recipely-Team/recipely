import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { FeedFooter } from '@presentation/base/widgets/lists/feed-footer';
import { StoreStatus } from '@application/store/store-status';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { ListConstants } from '@presentation/base/constants/list-constants';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import { PageTitle } from '@presentation/base/widgets/head/page-title';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { failureContent, failureIcon, failureSeverity } from '@presentation/base/errors/failure-lookups';
import { AutomationsBar } from '@presentation/app/automations/shared/items/automations-bar';
import { useAutomationActivity } from '@presentation/app/automations/activity/hooks/use-automation-activity';
import { ActivitySummary } from '@presentation/app/automations/activity/body/activity-summary';
import { SendRow } from '@presentation/app/automations/activity/items/send-row';
import { borderWidths, controlSizes, fontSizes, fontWeights, lineHeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

/**
 * One automation's Activity (spec §4): what it is, how many it sent, and
 * every matched comment with how its private reply went — paged on scroll,
 * with the no-retry note under it.
 */
export const AutomationActivityScreen = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const vm = useAutomationActivity();
  const scrollable = useAssistantScrollable(vm.opened.status === StoreStatus.Loaded);
  const copy = t().instagram;
  const failed = vm.opened.status === StoreStatus.Error ? vm.opened.failure : vm.sends.status === StoreStatus.Error ? vm.sends.failure : null;

  const edit = (
    <Pressable onPress={vm.onEdit} accessibilityRole="button" style={[styles.edit, { borderColor: colors.cardBorder }]}>
      <SizedText size={fontSizes.caption} weight={fontWeights.bold}>
        {copy.edit}
      </SizedText>
    </Pressable>
  );

  const body = (): React.JSX.Element => {
    if (failed !== null) {
      const content = failureContent(failed);
      return <ErrorState icon={failureIcon(failed)} severity={failureSeverity(failed)} title={content.title} body={content.body} primaryLabel={copy.tryAgain} onPrimary={vm.onRetry} />;
    }
    if (vm.opened.status !== StoreStatus.Loaded) return <ActivityIndicator style={styles.spinner} color={colors.primary} />;
    const sends = vm.sends;
    return (
      <FlatList
        {...scrollable}
        data={vm.shown}
        keyExtractor={(send) => send.id}
        renderItem={({ item }) => <SendRow send={item} />}
        ListHeaderComponent={
          <ActivitySummary rule={vm.opened.rule} isPaused={vm.isPaused} filter={vm.filter} onFilter={vm.setFilter} onToggle={vm.onToggle} />
        }
        ListEmptyComponent={
          sends.status === StoreStatus.Loaded ? (
            <SizedText size={fontSizes.medium} muted style={styles.empty}>
              {copy.noActivity}
            </SizedText>
          ) : (
            <ActivityIndicator color={colors.primary} />
          )
        }
        ListFooterComponent={
          <>
            <FeedFooter
              isLoadingMore={sends.status === StoreStatus.Loaded && sends.isLoadingMore}
              failure={sends.status === StoreStatus.Loaded ? sends.moreFailure : null}
              onRetry={vm.onEndReached}
            />
            <SizedText size={fontSizes.small} ratio={lineHeights.normal} color={colors.textSubtle} style={styles.note}>
              {copy.failNote}
            </SizedText>
          </>
        }
        onEndReached={vm.onEndReached}
        onEndReachedThreshold={ListConstants.endReachedThreshold}
        contentContainerStyle={styles.list}
      />
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PageTitle subject={copy.activity} />
      <AutomationsBar title={copy.activity} subtitle={null} icon="chevron-back" onBack={vm.onBack} right={edit} />
      <View style={styles.content}>{body()}</View>
    </View>
  );
};

export default AutomationActivityScreen;

const styles = StyleSheet.create({
  screen: { flex: ValueConstants.one },
  content: { flex: ValueConstants.one, width: '100%', maxWidth: AutomationMetrics.pageMaxWidth, alignSelf: 'center' },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  spinner: { marginTop: spacing.xl },
  empty: { textAlign: 'center', paddingVertical: spacing.xl },
  note: { marginTop: spacing.lg },
  edit: { minHeight: controlSizes.iconBtn, paddingHorizontal: spacing.md, borderRadius: radii.round, borderWidth: borderWidths.hairline, justifyContent: 'center' },
});
