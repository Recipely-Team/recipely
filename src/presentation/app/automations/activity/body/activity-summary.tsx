import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { SegmentedTabs } from '@presentation/base/widgets/diary/segmented-tabs';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { RuleThumb } from '@presentation/app/automations/shared/items/rule-thumb';
import { KeywordChips } from '@presentation/app/automations/shared/items/keyword-chips';
import { AutomationSwitch } from '@presentation/app/automations/shared/items/automation-switch';
import { SendFilter, type SendFilterType } from '@presentation/app/automations/activity/model/send-filter';
import { borderWidths, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface ActivitySummaryProps {
  rule: DmRuleEntity;
  isPaused: boolean;
  filter: SendFilterType;
  onFilter: (filter: SendFilterType) => void;
  onToggle: (enabled: boolean) => void;
}

/** Above the activity (spec §4): the post, every keyword, the recipe and the switch; the Sent count; the segment. */
export const ActivitySummary = ({ rule, isPaused, filter, onFilter, onToggle }: ActivitySummaryProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const copy = t().instagram;
  return (
    <View style={styles.stack}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <RuleThumb uri={rule.media.thumbnailUrl} size={AutomationMetrics.summaryThumb} />
        <View style={styles.body}>
          <KeywordChips keywords={rule.keywords} limit={null} />
          <View style={styles.recipe}>
            <Ionicons name="restaurant-outline" size={iconSizes.sm} color={colors.textSubtle} />
            <SizedText size={fontSizes.medium} weight={fontWeights.bold} numberOfLines={ValueConstants.one}>
              {rule.recipe?.name ?? rule.recipeId}
            </SizedText>
          </View>
        </View>
        <AutomationSwitch value={rule.enabled} disabled={isPaused} onChange={onToggle} />
      </View>
      <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <SizedText size={fontSizes.subheading} weight={fontWeights.heavy}>
          {formatWholeNumber(rule.sentCount, locale)}
        </SizedText>
        <SizedText size={fontSizes.small} color={colors.textSubtle}>
          {copy.statSent}
        </SizedText>
      </View>
      <SegmentedTabs
        options={[
          { key: SendFilter.All, label: copy.filterAll },
          { key: SendFilter.Sent, label: copy.filterSent },
          { key: SendFilter.Failed, label: copy.filterFailed },
        ]}
        value={filter}
        onChange={onFilter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.md, paddingBottom: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.xl, borderWidth: borderWidths.hairline },
  body: { flex: ValueConstants.one, minWidth: ValueConstants.zero, gap: spacing.xs },
  recipe: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stat: { padding: spacing.md, borderRadius: radii.lg, borderWidth: borderWidths.hairline, gap: spacing.xxs },
});
