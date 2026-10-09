import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CharConstants, ValueConstants } from '@core/constants';
import type { StatsPost } from '@domain/instagram/stats/stats-post';
import { funnelRate } from '@domain/instagram/stats/funnel-rate';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { RuleThumb } from '@presentation/app/automations/shared/items/rule-thumb';
import { KeywordChips } from '@presentation/app/automations/shared/items/keyword-chips';
import { StatsMetrics } from '@presentation/app/automations/stats/model/stats-metrics';
import { fontSizes, fontWeights, iconSizes, letterSpacings, opacities, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface PostRowProps {
  post: StatsPost;
  /** The table row (≥ 720 wide) instead of the stacked one. */
  wide: boolean;
  onPress: (ruleId: string) => void;
}

/** One automated post (spec "Per-post"): its cover, keywords and how its DMs did; opens its Activity. */
export const PostRow = ({ post, wide, onPress }: PostRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const copy = t().creatorStats;
  const rate = post.sent > ValueConstants.zero ? `${funnelRate(post.opened, post.sent)}%` : CharConstants.emDash;
  const n = (value: number): string => formatWholeNumber(value, locale);
  const label = `${post.keywords.join(', ')} · ${copy.rowMeta.replace('{s}', n(post.sent)).replace('{o}', n(post.opened)).replace('{v}', n(post.saved))} · ${copy.colRate} ${rate}`;

  return (
    <Pressable
      onPress={() => onPress(post.ruleId)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, { borderColor: colors.border, opacity: pressed ? opacities.pressed : opacities.full }]}
    >
      <RuleThumb uri={post.thumbnailUrl} size={wide ? StatsMetrics.postColumn : StatsMetrics.postThumb} />
      {wide ? (
        <>
          <View style={styles.grow}>
            <KeywordChips keywords={post.keywords} limit={StatsMetrics.keywordsShownWide} />
          </View>
          {[post.sent, post.opened].map((value, i) => (
            <SizedText key={`n-${i}`} size={fontSizes.medium} style={[styles.number, { width: StatsMetrics.numberColumn }]}>
              {n(value)}
            </SizedText>
          ))}
          <SizedText size={fontSizes.medium} style={[styles.number, { width: StatsMetrics.savedColumn }]}>
            {n(post.saved)}
          </SizedText>
          <SizedText size={fontSizes.medium} weight={fontWeights.heavy} style={[styles.number, { width: StatsMetrics.rateColumn }]}>
            {rate}
          </SizedText>
        </>
      ) : (
        <>
          <View style={[styles.grow, styles.stack]}>
            <KeywordChips keywords={post.keywords} limit={StatsMetrics.keywordsShown} />
            <SizedText size={fontSizes.small} color={colors.textSubtle}>
              {copy.rowMeta.replace('{s}', n(post.sent)).replace('{o}', n(post.opened)).replace('{v}', n(post.saved))}
            </SizedText>
          </View>
          <View style={styles.rate}>
            <SizedText size={fontSizes.heading} weight={fontWeights.heavy} style={styles.tabular}>
              {rate}
            </SizedText>
            <SizedText size={fontSizes.tiny} color={colors.textSubtle} style={styles.caps}>
              {copy.rateCaption.toUpperCase()}
            </SizedText>
          </View>
        </>
      )}
      <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, minHeight: StatsMetrics.postRow, paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  grow: { flex: ValueConstants.one, minWidth: ValueConstants.zero },
  stack: { gap: spacing.xs },
  number: { textAlign: 'right', fontVariant: ['tabular-nums'] },
  tabular: { fontVariant: ['tabular-nums'] },
  rate: { alignItems: 'flex-end' },
  caps: { letterSpacing: letterSpacings.wide },
});
