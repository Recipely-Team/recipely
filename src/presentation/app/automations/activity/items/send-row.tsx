import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DmSend } from '@domain/instagram/activity/dm-send';
import { CharConstants, ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useSeveritySurfaces } from '@presentation/base/theme/colors/surfaces/use-severity-surfaces';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { formatTimeAgo } from '@presentation/base/utils/format-time-ago';
import { sendLookFor } from '@presentation/app/automations/activity/model/send-look-for';
import { borderWidths, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface SendRowProps {
  send: DmSend;
}

const AT = '@';
const OPEN_QUOTE = '“';
const CLOSE_QUOTE = '”';

/** One matched comment (spec §4): initials, @handle and when, the comment quoted, and how its reply went. */
export const SendRow = ({ send }: SendRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const look = sendLookFor(send);
  const surface = useSeveritySurfaces()[look.severity];
  const name = send.commenterUsername === null ? t().instagram.someone : `${AT}${send.commenterUsername}`;
  const initial = (send.commenterUsername ?? t().instagram.someone).charAt(ValueConstants.zero).toUpperCase();
  return (
    <View role="status" style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: colors.chipBackground }]}>
        <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.chipText}>
          {initial}
        </SizedText>
      </View>
      <View style={styles.text}>
        <View style={styles.head}>
          <SizedText size={fontSizes.medium} weight={fontWeights.bold} numberOfLines={ValueConstants.one} style={styles.name}>
            {name}
          </SizedText>
          <SizedText size={fontSizes.small} color={colors.textSubtle}>
            {formatTimeAgo(send.createdAt)}
          </SizedText>
        </View>
        {send.commentText === null ? null : (
          <SizedText size={fontSizes.caption} color={colors.textSubtle} numberOfLines={ValueConstants.one}>
            {`${OPEN_QUOTE}${send.commentText}${CLOSE_QUOTE}`}
          </SizedText>
        )}
        <View style={[styles.pill, { backgroundColor: surface.bg, borderColor: surface.border }]}>
          <Ionicons name={look.icon} size={iconSizes.xs} color={surface.icon} />
          <SizedText size={fontSizes.micro} weight={fontWeights.bold} color={surface.text}>
            {look.label}
          </SizedText>
          {send.publicReplied ? (
            <SizedText size={fontSizes.micro} color={surface.text}>
              {`${CharConstants.middotSpaced}${t().instagram.publicReplied}`}
            </SizedText>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, minHeight: AutomationMetrics.activityRow, paddingVertical: spacing.sm, borderBottomWidth: borderWidths.hairline },
  avatar: { width: AutomationMetrics.activityAvatar, height: AutomationMetrics.activityAvatar, borderRadius: radii.round, alignItems: 'center', justifyContent: 'center' },
  text: { flex: ValueConstants.one, minWidth: ValueConstants.zero, gap: spacing.xxs },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  name: { flexShrink: ValueConstants.one },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: AutomationMetrics.statusPill,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    marginTop: spacing.xxs,
  },
});
