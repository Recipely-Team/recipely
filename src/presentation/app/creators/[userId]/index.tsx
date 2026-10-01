import { StyleSheet, View } from 'react-native';
import { StoreStatus } from '@application/store/store-status';
import { CharConstants, ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { PageTitle } from '@presentation/base/widgets/head/page-title';
import { SignInPromptSheet } from '@presentation/base/widgets/sheets/sign-in-prompt-sheet';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { ListState } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { listReading } from '@presentation/base/hooks/assistant/args/describing/list-reading';
import { recipeRoster } from '@presentation/base/hooks/assistant/args/describing/recipe-roster';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';
import { CreatorsPageHeader } from '@presentation/app/creators/[userId]/body/creators-page-header';
import { CreatorsRoundButton } from '@presentation/app/creators/[userId]/body/creators-round-button';
import { useCreatorProfile } from '@presentation/app/creators/[userId]/hooks/use-creator-profile';
import { CreatorProfileBody } from '@presentation/app/creators/[userId]/body/creator-profile-body';
import { t } from '@presentation/i18n';

/** How the assistant names this page's list of recipes. */
const ROSTER_LABEL = 'recipes';

/**
 * /creators/[userId] — one creator's public page: who they are, their verified
 * account, follower numbers, a follow button and their recipes. Guests see
 * all of it; following asks them to sign in.
 */
export const CreatorProfileScreen = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const vm = useCreatorProfile();
  const scrollable = useAssistantScrollable();

  const loaded = vm.profileState.status === StoreStatus.Loaded ? vm.profileState.viewed : null;
  const name = loaded?.profile.displayName ?? CharConstants.empty;
  const listState =
    vm.recipesState.status === StoreStatus.Loaded
      ? ListState.Ready
      : vm.recipesState.status === StoreStatus.Error
        ? ListState.Failed
        : ListState.Loading;
  const recipeNames = vm.recipes.map((recipe) => recipe.name);
  useAssistantScreenContent(() => [name, recipeRoster(ROSTER_LABEL, recipeNames, listState)].join(SCREEN_PART_SEPARATOR));
  useAssistantScreenReading(() =>
    [name, (loaded?.profile.creatorTags ?? []).map((tag) => tag.displayHandle).join(CharConstants.commaSpace), loaded?.profile.bio ?? CharConstants.empty, listReading(ROSTER_LABEL, recipeNames, listState)]
      .filter((part) => part.length > ValueConstants.zero)
      .join(SCREEN_PART_SEPARATOR),
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PageTitle subject={name} />
      <ResponsiveContainer route="creatorProfile" gutter={false} fill>
        <CreatorsPageHeader
          onBack={vm.onBack}
          backLabel={t().creators.backToChefs}
          trailing={loaded !== null ? <CreatorsRoundButton icon="share-outline" label={t().creators.share} onPress={vm.onShare} /> : null}
        />
        <CreatorProfileBody vm={vm} scrollable={scrollable} />
      </ResponsiveContainer>
      <SignInPromptSheet visible={vm.promptVisible} onClose={vm.onClosePrompt} onSignIn={vm.onGoToSignIn} message={vm.promptMessage} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: ValueConstants.one },
});

export default CreatorProfileScreen;
