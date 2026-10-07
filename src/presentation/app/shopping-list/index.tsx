import { StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import { StoreStatus } from '@application/store/store-status';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { ListState } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import { PageTitle } from '@presentation/base/widgets/head/page-title';
import { ConfirmSheet } from '@presentation/base/widgets/sheets/confirm-sheet';
import { failureContent, failureIcon, failureSeverity } from '@presentation/base/errors/failure-lookups';
import { useShoppingList } from '@presentation/app/shopping-list/hooks/use-shopping-list';
import { useShoppingItemEditor } from '@presentation/app/shopping-list/hooks/use-shopping-item-editor';
import { useAssistantShoppingActions } from '@presentation/app/shopping-list/hooks/use-assistant-shopping-actions';
import { ShoppingConfirm } from '@presentation/app/shopping-list/model/shopping-confirm';
import { ShoppingListBar } from '@presentation/app/shopping-list/body/shopping-list-bar';
import { ShoppingListBody } from '@presentation/app/shopping-list/body/shopping-list-body';
import { ShoppingItemEditSheet } from '@presentation/app/shopping-list/sheets/shopping-item-edit-sheet';
import { t } from '@presentation/i18n';

/**
 * The viewer's shopping list: what is left to buy, then what is done; add,
 * tick, edit and remove lines, clear the completed ones or everything.
 * Paged on scroll, pulled to refresh. Signed-out users are sent to sign-in by
 * the auth guard.
 */
export const ShoppingListScreen = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const vm = useShoppingList();
  const editor = useShoppingItemEditor();
  const list = vm.list;
  const scrollable = useAssistantScrollable(list.status !== StoreStatus.Error);
  const copy = t().shopping;
  useAssistantShoppingActions({
    items: vm.items,
    listState: list.status === StoreStatus.Loaded ? ListState.Ready : list.status === StoreStatus.Error ? ListState.Failed : ListState.Loading,
    onToggle: vm.onToggle,
    onReload: vm.onRefresh,
  });

  const body = (): React.JSX.Element => {
    if (list.status === StoreStatus.Error) {
      const content = failureContent(list.failure);
      return (
        <ErrorState icon={failureIcon(list.failure)} severity={failureSeverity(list.failure)} title={content.title} body={content.body} primaryLabel={copy.tryAgain} onPrimary={vm.onRetry} />
      );
    }
    return <ShoppingListBody vm={vm} scrollable={scrollable} onEdit={editor.open} />;
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <PageTitle subject={copy.title} />
      <ShoppingListBar onBack={vm.onBack} />
      <ResponsiveContainer route="shoppingList" fill>
        {body()}
      </ResponsiveContainer>
      <ShoppingItemEditSheet editor={editor} />
      <ConfirmSheet
        visible={vm.confirm !== null}
        title={vm.confirm === ShoppingConfirm.ClearAll ? copy.clearAll : copy.clearCompleted}
        message={vm.confirm === ShoppingConfirm.ClearAll ? copy.clearAllQ : copy.clearCompletedQ}
        confirmLabel={vm.confirm === ShoppingConfirm.ClearAll ? copy.clearAll : copy.clearCompleted}
        destructive
        loading={vm.isConfirming}
        onConfirm={vm.onConfirm}
        onClose={vm.onCloseConfirm}
      />
    </View>
  );
};

export default ShoppingListScreen;

const styles = StyleSheet.create({
  screen: { flex: ValueConstants.one },
});
