import { Pressable, StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { controlSizes, fontSizes, fontWeights, letterSpacings, opacities, spacing } from '@presentation/base/theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorCard } from '@presentation/base/widgets/creators/creator-card';
import { webCreatorsColumns } from '@presentation/app/recipes/model/web-creators-columns';
import { useCreatorsStrip } from '@presentation/app/recipes/hooks/use-creators-strip';
import { t } from '@presentation/i18n';

/** Between cards, as the prototype's six-column row. */
const GRID_GAP = spacing.lg;

/**
 * The expanded viewport's "Creators" section: the strip becomes one row of
 * cards across the feed's content column, above the recipe grid.
 *
 * @remarks
 * - **One row of six, three below an 860 viewport.** "See all" opens the
 *   rest; a second row here would push the recipes, which are the page, below
 *   the fold.
 * - **Empty cells keep the widths.** Three creators in a six-column row stay
 *   card-sized rather than stretching to half the page each.
 */
export const WebCreatorsGrid = (): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const { width } = useLayout();
  const { creators, isVisible, onOpenCreator, onOpenAll } = useCreatorsStrip();
  if (!isVisible) return null;

  const columns = webCreatorsColumns(width);
  const shown = creators.slice(ValueConstants.zero, columns);
  const fillers = Array.from({ length: columns - shown.length }, (_, index) => index);

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <SizedText size={fontSizes.display} weight={fontWeights.heavy} accessibilityRole="header" style={styles.title}>
          {t().creators.title}
        </SizedText>
        <Pressable
          onPress={onOpenAll}
          accessibilityRole="button"
          accessibilityLabel={t().creators.seeAll}
          style={({ pressed }) => [styles.seeAll, { opacity: pressed ? opacities.pressed : opacities.full }]}
        >
          <SizedText size={fontSizes.medium} weight={fontWeights.bold} color={colors.primary}>
            {t().creators.seeAll}
          </SizedText>
        </Pressable>
      </View>
      <View style={styles.row}>
        {shown.map((creator) => (
          <View key={creator.id} style={styles.cell}>
            <CreatorCard creator={creator} onOpen={onOpenCreator} />
          </View>
        ))}
        {fillers.map((index) => (
          <View key={`filler-${index}`} style={styles.cell} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  title: {
    letterSpacing: letterSpacings.tight,
  },
  seeAll: {
    minHeight: controlSizes.segmentOption,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  cell: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
  },
});
