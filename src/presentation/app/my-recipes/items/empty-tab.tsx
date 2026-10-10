import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { TabIcons } from '@presentation/app/my-recipes/model/tab-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { iconSizes, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

const EMPTY_COPY: Record<TabType, () => string> = {
  [TabType.Saved]: () => t().myRecipes.emptySaved,
  [TabType.Liked]: () => t().myRecipes.emptyLiked,
  [TabType.Created]: () => t().myRecipes.emptyCreated,
  [TabType.Drafts]: () => t().drafts.empty,
};

export interface EmptyTabProps {
  tab: TabType;
  /** Saved and Liked fill up from the feed. */
  onBrowse: () => void;
  /** Created and Drafts fill up from the create screen. */
  onCreate: () => void;
}

/**
 * An empty My Recipes tab: its icon, what would be here, and the one action that
 * fills it — the feed for Saved / Liked, the create screen for Created / Drafts.
 * It used to stop at the sentence, while the feed's and Chefs' empty states each
 * offered a next step.
 */
export const EmptyTab = ({ tab, onBrowse, onCreate }: EmptyTabProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const fillsFromFeed = tab === TabType.Saved || tab === TabType.Liked;
  return (
    <View style={styles.empty}>
      <MaterialCommunityIcons name={TabIcons[tab]} size={iconSizes.jumbo} color={colors.textMuted} />
      <ThemedText variant="body" muted style={styles.emptyText}>
        {EMPTY_COPY[tab]()}
      </ThemedText>
      <PrimaryButton
        label={fillsFromFeed ? t().recipes.browseRecipes : t().myRecipes.createNew}
        onPress={fillsFromFeed ? onBrowse : onCreate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  empty: {
    alignItems: 'stretch',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
  },
});
