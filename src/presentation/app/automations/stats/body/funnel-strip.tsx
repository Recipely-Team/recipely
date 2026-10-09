import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import type { CreatorStats } from '@domain/instagram/stats/creator-stats';
import type { FunnelCounts } from '@domain/instagram/stats/funnel-counts';
import { funnelRate } from '@domain/instagram/stats/funnel-rate';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { FunnelCell } from '@presentation/app/automations/stats/items/funnel-cell';
import { borderWidths, fontSizes, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface FunnelStripProps {
  stats: CreatorStats;
  /** One row of four (≥ 600 wide) or a 2 × 2 grid. */
  inRow: boolean;
  wide: boolean;
}

type Step = keyof FunnelCounts;
const STEPS: readonly Step[] = ['matched', 'sent', 'opened', 'saved'];
const PAIR = 2;

/** The range's funnel (spec "Funnel strip"): comments matched → DMs sent → recipe opened → recipe saved. */
export const FunnelStrip = ({ stats, inRow, wide }: FunnelStripProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const copy = t().creatorStats;
  const posts = stats.posts.filter((post) => post.sent > ValueConstants.zero).length;
  const caption = (step: Step, index: number): string => {
    const prev = STEPS[index - ValueConstants.one];
    if (prev === undefined) return copy.onPosts.replace('{n}', formatWholeNumber(posts, locale));
    const template = prev === 'matched' ? copy.rateOfMatched : prev === 'sent' ? copy.rateOfSent : copy.rateOfOpened;
    return template.replace('{x}', String(funnelRate(stats.totals[step], stats.totals[prev])));
  };
  const cells = STEPS.map((step, index) => (
    <FunnelCell
      key={step}
      label={copy[step]}
      value={formatWholeNumber(stats.totals[step], locale)}
      caption={caption(step, index)}
      current={stats.totals[step]}
      previous={stats.previous[step]}
      days={stats.days}
      wide={wide}
    />
  ));
  const divider = (key: string, vertical: boolean): React.JSX.Element => (
    <View key={key} style={[vertical ? styles.vDivider : styles.hDivider, { backgroundColor: colors.border }]} />
  );
  const rows = inRow ? [cells] : [cells.slice(ValueConstants.zero, PAIR), cells.slice(PAIR)];
  return (
    <View style={styles.stack}>
      <View style={[styles.strip, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        {rows.map((row, r) => (
          <Fragment key={`row-${r}`}>
            {r > ValueConstants.zero ? divider(`h-${r}`, false) : null}
            <View style={styles.row}>
              {row.map((cell, c) => (
                <Fragment key={`cell-${c}`}>
                  {c > ValueConstants.zero ? divider(`v-${c}`, true) : null}
                  {cell}
                </Fragment>
              ))}
            </View>
          </Fragment>
        ))}
      </View>
      <SizedText size={fontSizes.small} color={colors.textSubtle}>
        {copy.vsPrev.replace('{n}', String(stats.days))}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  strip: { borderRadius: radii.xl, borderWidth: borderWidths.hairline, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  vDivider: { width: borderWidths.hairline },
  hDivider: { height: borderWidths.hairline },
});
