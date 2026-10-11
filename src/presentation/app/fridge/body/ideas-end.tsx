import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { GhostButton } from '@presentation/app/fridge/items/buttons/ghost-button';
import { IdeasLoad, type IdeasLoadType } from '@presentation/app/fridge/model/ideas/ideas-load';

export interface IdeasEndProps {
  load: IdeasLoadType;
  /** No idea came back at all. */
  empty: boolean;
  canClearFilters: boolean;
  onShowMore: () => void;
  onClearFilters: () => void;
}

/**
 * What sits under the ideas: "Show 3 more" while more may exist, "That's all
 * for these ingredients" at the end, or — when nothing matched at all — the
 * no-match card, with "Clear filters" when a filter is what narrowed it.
 */
export const IdeasEnd = ({ load, empty, canClearFilters, onShowMore, onClearFilters }: IdeasEndProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const copy = t().fridge;
  if (load === IdeasLoad.Idle) return <GhostButton icon="add" label={copy.showMore} onPress={onShowMore} />;
  if (load !== IdeasLoad.Exhausted) return null;
  if (!empty) {
    return (
      <SizedText size={fontSizes.caption} muted style={styles.center}>
        {copy.noMore}
      </SizedText>
    );
  }
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <Ionicons name="funnel-outline" size={iconSizes.xl} color={colors.textMuted} />
      <SizedText size={fontSizes.medium} weight={fontWeights.semibold} style={styles.center}>
        {canClearFilters ? copy.noMatch : copy.noMore}
      </SizedText>
      {canClearFilters ? <GhostButton compact label={copy.clearFilters} onPress={onClearFilters} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  card: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
});
