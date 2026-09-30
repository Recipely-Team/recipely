import { StyleSheet, View } from 'react-native';
import { StoreStatus } from '@application/store/store-status';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { PageTitle } from '@presentation/base/widgets/head/page-title';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { ListState } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { listReading } from '@presentation/base/hooks/assistant/args/describing/list-reading';
import { recipeRoster } from '@presentation/base/hooks/assistant/args/describing/recipe-roster';
import { useCreatorsScreen } from '@presentation/app/creators/hooks/use-creators-screen';
import { CreatorsPageHeader } from '@presentation/app/creators/shared/body/creators-page-header';
import { CreatorsGrid } from '@presentation/app/creators/body/creators-grid';
import { t } from '@presentation/i18n';

/** How the assistant names this page's one list. */
const ROSTER_LABEL = 'creators';

/**
 * /creators — every approved creator as a card grid, from the Explore strip's
 * "See all". Public: guests browse it too.
 */
export const CreatorsScreen = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const vm = useCreatorsScreen();
  const scrollable = useAssistantScrollable();

  const listState =
    vm.listState.status === StoreStatus.Loaded
      ? ListState.Ready
      : vm.listState.status === StoreStatus.Error
        ? ListState.Failed
        : ListState.Loading;
  const names = vm.creators.map((creator) => creator.displayName);
  useAssistantScreenContent(() => recipeRoster(ROSTER_LABEL, names, listState));
  useAssistantScreenReading(() => listReading(ROSTER_LABEL, names, listState));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PageTitle subject={t().creators.title} />
      <ResponsiveContainer route="creators" gutter={false} fill>
        <CreatorsPageHeader onBack={vm.onBack} title={t().creators.title} />
        <CreatorsGrid vm={vm} scrollable={scrollable} />
      </ResponsiveContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: ValueConstants.one },
});

export default CreatorsScreen;
