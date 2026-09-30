import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import { ListConstants } from '@presentation/base/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { controlSizes, fontSizes, fontWeights, opacities, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorStripItem } from '@presentation/base/widgets/creators/creator-strip-item';
import { useCreatorsStrip } from '@presentation/app/recipes/hooks/use-creators-strip';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

const keyOf = (creator: CreatorSummaryEntity): string => creator.id;

/**
 * The phone feed's "Creators" strip: a heading with "See all", then one row
 * of creators that scrolls sideways, directly above the recipe list.
 *
 * @remarks
 * - **Renders nothing until there is a creator to show** (`useCreatorsStrip`).
 * - **Full-bleed.** It sits inside `MobileFeedHeader`, which cancels the list's
 *   inset, so the row scrolls to the screen edge and pads its own ends.
 */
export const CreatorsStrip = (): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const { creators, isVisible, onOpenCreator, onOpenAll, onEndReached } = useCreatorsStrip();
  const renderItem = useCallback(
    ({ item }: { item: CreatorSummaryEntity }) => <CreatorStripItem creator={item} onOpen={onOpenCreator} />,
    [onOpenCreator],
  );

  if (!isVisible) return null;

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <View style={styles.titles}>
          <SizedText size={fontSizes.subtitle} weight={fontWeights.bold} accessibilityRole="header">
            {t().creators.title}
          </SizedText>
          <SizedText size={fontSizes.small} color={colors.textSubtle}>
            {t().creators.stripSubtitle}
          </SizedText>
        </View>
        <Pressable
          onPress={onOpenAll}
          accessibilityRole="button"
          accessibilityLabel={t().creators.seeAll}
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.seeAll, { opacity: pressed ? opacities.pressed : opacities.full }]}
        >
          <SizedText size={fontSizes.medium} weight={fontWeights.bold} color={colors.primary}>
            {t().creators.seeAll}
          </SizedText>
        </Pressable>
      </View>
      <FlatList
        horizontal
        data={creators}
        keyExtractor={keyOf}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        onEndReached={onEndReached}
        onEndReachedThreshold={ListConstants.endReachedThreshold}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  titles: {
    flexShrink: ValueConstants.one,
    gap: spacing.xxs,
  },
  seeAll: {
    minHeight: controlSizes.touchTarget,
    justifyContent: 'center',
  },
  row: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
