import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { autoFillColumns } from '@presentation/base/widgets/creators/auto-fill-columns';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fontSizes, fontWeights, fridgeSizes, lineHeights, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { IdeaCard } from '@presentation/app/fridge/items/ideas/idea-card';
import { IdeaSkeletonCard } from '@presentation/app/fridge/items/ideas/idea-skeleton-card';
import { IdeasEnd } from '@presentation/app/fridge/body/ideas-end';
import { IdeasLoad, type IdeasLoadType } from '@presentation/app/fridge/model/ideas/ideas-load';
import type { FridgeIdeasQuery } from '@presentation/app/fridge/model/ideas/fridge-ideas-query';
import { hasActiveFilters } from '@presentation/app/fridge/model/filters/has-active-filters';
import { CharConstants, ValueConstants } from '@core/constants';

export interface IdeasStepProps {
  query: FridgeIdeasQuery;
  ideas: readonly FridgeIdea[];
  load: IdeasLoadType;
  added: readonly string[];
  /** A grid of cards (min 260 wide) on an expanded layout; one column on a phone. */
  grid: boolean;
  onEdit: () => void;
  onCook: (idea: FridgeIdea) => void;
  onAddMissing: (idea: FridgeIdea) => void;
  onShowMore: () => void;
  onClearFilters: () => void;
}

/** Skeleton cards shown for a page in flight — one page's worth. */
const PAGE_SKELETONS = 3;

/**
 * Step 3: the ideas for the ingredients and filters asked about. Skeleton
 * cards while a page loads; "Show 3 more", the end of the list, or the
 * no-match card below.
 */
export const IdeasStep = ({ query, ideas, load, added, grid, onEdit, onCook, onAddMissing, onShowMore, onClearFilters }: IdeasStepProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().fridge;
  const [width, setWidth] = useState(ValueConstants.zero);
  const columns = grid ? autoFillColumns(width, fridgeSizes.ideaCardMinWidth, spacing.md, ValueConstants.one) : ValueConstants.one;
  const cardWidth = columns > ValueConstants.one ? (width - spacing.md * (columns - ValueConstants.one)) / columns : undefined;
  const loading = load === IdeasLoad.First || load === IdeasLoad.More;
  const { filters } = query;
  const sub = [
    copy.ideasBasedOn.replace('{n}', String(query.ingredients.length)),
    ...(filters.maxMinutes === null ? [] : [copy.minutes.replace('{n}', String(filters.maxMinutes))]),
    copy.ideasServings.replace('{n}', String(filters.servings)),
  ].join(CharConstants.middotSpaced);
  const cell = cardWidth === undefined ? styles.full : { width: cardWidth };

  return (
    <View style={styles.root}>
      <View style={styles.heading}>
        <SizedText accessibilityRole="header" size={fontSizes.display} weight={fontWeights.heavy} ratio={lineHeights.tight}>
          {copy.ideasTitle}
        </SizedText>
        <View style={styles.subRow}>
          <SizedText size={fontSizes.medium} ratio={lineHeights.normal} muted style={styles.sub}>
            {sub}
          </SizedText>
          <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel={copy.edit} hitSlop={spacing.sm}>
            <SizedText size={fontSizes.medium} weight={fontWeights.bold} color={colors.primary}>
              {copy.edit}
            </SizedText>
          </Pressable>
        </View>
      </View>
      <View style={styles.grid} onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}>
        {ideas.map((idea) => (
          <View key={idea.title} style={cell}>
            <IdeaCard idea={idea} added={added.includes(idea.title)} onCook={onCook} onAddMissing={onAddMissing} />
          </View>
        ))}
        {loading
          ? Array.from({ length: PAGE_SKELETONS }, (_, index) => (
              <View key={`skeleton-${index}`} style={cell} accessibilityLabel={copy.ideasLoading}>
                <IdeaSkeletonCard />
              </View>
            ))
          : null}
      </View>
      <IdeasEnd
        load={load}
        empty={ideas.length === ValueConstants.zero}
        canClearFilters={hasActiveFilters(filters)}
        onShowMore={onShowMore}
        onClearFilters={onClearFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
  heading: {
    gap: spacing.xs,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  sub: {
    flex: ValueConstants.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  full: {
    width: '100%',
  },
});
