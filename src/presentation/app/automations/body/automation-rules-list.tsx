import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { FeedFooter } from '@presentation/base/widgets/lists/feed-footer';
import { StoreStatus } from "@application/store/store-status";
import { useTheme } from "@presentation/base/theme/context/use-theme";
import type { AssistantScrollableProps } from "@presentation/base/hooks/assistant/actions/assistant-scrollable-props";
import { ListConstants } from "@presentation/base/constants/list-constants";
import { spacing } from "@presentation/base/theme";
import type { UseAutomationsResult } from "@presentation/app/automations/model/use-automations-result";
import { AutomationsHeader } from "@presentation/app/automations/body/automations-header";
import { AutomationsEmpty } from "@presentation/app/automations/body/automations-empty";
import { RulesNote } from "@presentation/app/automations/body/rules-note";
import { RuleCard } from "@presentation/app/automations/items/rule-card";

export interface AutomationRulesListProps {
  vm: UseAutomationsResult;
  scrollable: AssistantScrollableProps;
}

/** The creator's comment-to-DM rules, paged on scroll, under the connection header and above the rules note. */
export const AutomationRulesList = ({ vm, scrollable }: AutomationRulesListProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const rules = vm.rules;
  return (
    <FlatList
      {...scrollable}
      data={rules.status === StoreStatus.Loaded ? rules.items : []}
      keyExtractor={(rule) => rule.id}
      renderItem={({ item }) => (
        <RuleCard
          rule={item}
          isPaused={vm.isPaused}
          onOpen={vm.onOpen}
          onToggle={vm.onToggle}
          onDelete={vm.onAskDelete}
        />
      )}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={
        <AutomationsHeader
          handle={vm.handle}
          isPaused={vm.isPaused}
          phase={vm.phase}
          onReconnect={vm.connect}
        />
      }
      ListEmptyComponent={
        rules.status === StoreStatus.Loaded ? (
          <AutomationsEmpty disabled={vm.isPaused} onCreate={vm.onNew} />
        ) : (
          <ActivityIndicator color={colors.primary} />
        )
      }
      ListFooterComponent={
        <>
          <FeedFooter
            isLoadingMore={rules.status === StoreStatus.Loaded && rules.isLoadingMore}
            failure={rules.status === StoreStatus.Loaded ? rules.moreFailure : null}
            onRetry={vm.onEndReached}
          />
          <RulesNote />
        </>
      }
      onEndReached={vm.onEndReached}
      onEndReachedThreshold={ListConstants.endReachedThreshold}
      contentContainerStyle={styles.list}
    />
  );
};

const Separator = (): React.JSX.Element => <View style={styles.separator} />;

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  separator: { height: spacing.sm },
});
