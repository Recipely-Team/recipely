import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ValueConstants } from '@core/constants';
import type { AiUsageLimit } from '@domain/subscriptions/ai-usage-limit';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';
import { useLocale } from '@presentation/i18n/use-locale';
import { useToday } from '@presentation/base/hooks/lifecycle/use-today';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { formatLimitReset } from '@presentation/base/utils/subscriptions/format-limit-reset';

export interface AiLimitUsagePanelProps {
  limit: AiUsageLimit;
}

/** "Used 200 / 200", a danger bar filled to used/limit, and when the limit resets. */
export const AiLimitUsagePanel = ({ limit }: AiLimitUsagePanelProps): React.JSX.Element => {
  const t = useTranslations();
  const locale = useLocale();
  const today = useToday();
  const colors = useTheme().colors;
  const copy = t.aiLimit;
  const share = limit.limit > ValueConstants.zero ? Math.min(ValueConstants.one, limit.used / limit.limit) : ValueConstants.one;
  const count = `${formatWholeNumber(limit.used, locale)} / ${formatWholeNumber(limit.limit, locale)}`;

  return (
    <View style={[styles.panel, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={styles.row}>
        <SizedText size={fontSizes.caption} weight={fontWeights.semibold}>
          {copy.used}
        </SizedText>
        <SizedText size={fontSizes.caption} weight={fontWeights.semibold}>
          {count}
        </SizedText>
      </View>
      <View style={[styles.track, { backgroundColor: colors.skeleton }]}>
        <View style={[styles.fill, { width: `${share * ValueConstants.percent}%`, backgroundColor: colors.danger }]} />
      </View>
      <View style={styles.row}>
        <View style={styles.label}>
          <Ionicons name="time-outline" size={iconSizes.md} color={colors.textSubtle} />
          <SizedText size={fontSizes.caption} color={colors.textSubtle}>
            {copy.resets}
          </SizedText>
        </View>
        <SizedText size={fontSizes.caption} weight={fontWeights.semibold} style={styles.value}>
          {formatLimitReset(t, limit.resetsAt, today, locale)}
        </SizedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radii.lg, borderWidth: borderWidths.thin, gap: spacing.sm, alignSelf: 'stretch' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  label: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  value: { flexShrink: ValueConstants.one, textAlign: 'right' },
  // A bar is a shape, not a text box: a pinned height is right here.
  track: { height: controlSizes.progressBar, borderRadius: radii.xs, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.xs },
});
