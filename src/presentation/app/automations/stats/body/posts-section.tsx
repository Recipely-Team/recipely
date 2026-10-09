import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import type { StatsPost } from '@domain/instagram/stats/stats-post';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PostRow } from '@presentation/app/automations/stats/items/post-row';
import { StatsMetrics } from '@presentation/app/automations/stats/model/stats-metrics';
import { borderWidths, controlSizes, fontSizes, fontWeights, letterSpacings, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface PostsSectionProps {
  posts: readonly StatsPost[];
  wide: boolean;
  onOpen: (ruleId: string) => void;
}

/** By post, sorted by opens (the server's order): five at a time, a table with a header row when wide. */
export const PostsSection = ({ posts, wide, onOpen }: PostsSectionProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().creatorStats;
  const [shown, setShown] = useState<number>(StatsMetrics.postsPerPage);
  const columns: readonly { key: string; label: string; width: number }[] = [
    { key: 'sent', label: copy.colSent, width: StatsMetrics.numberColumn },
    { key: 'opened', label: copy.colOpened, width: StatsMetrics.numberColumn },
    { key: 'saved', label: copy.colSaved, width: StatsMetrics.savedColumn },
    { key: 'rate', label: copy.colRate, width: StatsMetrics.rateColumn },
  ];
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <SizedText size={fontSizes.heading} weight={fontWeights.heavy} accessibilityRole="header">
        {copy.byPost}
      </SizedText>
      {wide ? (
        <View style={styles.head}>
          <SizedText size={fontSizes.micro} weight={fontWeights.bold} color={colors.textSubtle} numberOfLines={ValueConstants.one} style={[styles.caps, { width: StatsMetrics.postColumn }]}>
            {copy.colPost.toUpperCase()}
          </SizedText>
          <SizedText size={fontSizes.micro} weight={fontWeights.bold} color={colors.textSubtle} numberOfLines={ValueConstants.one} style={[styles.caps, styles.grow]}>
            {copy.colKeywords.toUpperCase()}
          </SizedText>
          {columns.map((c) => (
            <SizedText key={c.key} size={fontSizes.micro} weight={fontWeights.bold} color={colors.textSubtle} numberOfLines={ValueConstants.one} style={[styles.caps, styles.right, { width: c.width }]}>
              {c.label.toUpperCase()}
            </SizedText>
          ))}
          <View style={styles.chevronSpace} />
        </View>
      ) : null}
      {posts.slice(ValueConstants.zero, shown).map((post) => (
        <PostRow key={post.ruleId} post={post} wide={wide} onPress={onOpen} />
      ))}
      {posts.length > shown ? (
        <Pressable
          onPress={() => setShown((n) => n + StatsMetrics.postsPerPage)}
          accessibilityRole="button"
          style={[styles.more, { borderColor: colors.cardBorder }]}
        >
          <SizedText size={fontSizes.caption} weight={fontWeights.bold}>
            {copy.showMore}
          </SizedText>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.sm, borderRadius: radii.xl, borderWidth: borderWidths.hairline },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingTop: spacing.sm },
  grow: { flex: ValueConstants.one },
  right: { textAlign: 'right' },
  caps: { letterSpacing: letterSpacings.wide },
  chevronSpace: { width: spacing.lg2 },
  more: { alignSelf: 'center', minHeight: controlSizes.iconBtn, paddingHorizontal: spacing.lg, borderRadius: radii.round, borderWidth: borderWidths.hairline, justifyContent: 'center', marginTop: spacing.sm },
});
