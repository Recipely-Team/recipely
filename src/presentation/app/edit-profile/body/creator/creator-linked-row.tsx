import { Linking, StyleSheet, Text, View } from 'react-native';
import type { CreatorClaim } from '@domain/creators/creator-claim';
import { CreatorStatus } from '@domain/creators/creator-status';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fontSizes, fontWeights, lineHeights, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { CreatorPlatformMark } from '@presentation/base/widgets/creators/creator-platform-mark';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';
import { creatorPlatformName } from '@presentation/base/widgets/creators/creator-platform-name';
import { creatorProfileUrl } from '@presentation/base/widgets/creators/creator-profile-url';
import { t } from '@presentation/i18n';
import { CreatorStatusPill } from '@presentation/app/edit-profile/items/creator-status-pill';
import { CreatorRowAction } from '@presentation/app/edit-profile/items/creator-row-action';

export interface CreatorLinkedRowProps {
  claim: CreatorClaim;
  isBusy: boolean;
  onRemove: () => void;
  onTryAgain: () => void;
}

/**
 * One claimed platform (design spec §7, rev 2): seal, platform and `@handle`
 * (a link to the account once approved), the status pill, what review said,
 * and the one action — Withdraw in review, Unlink once approved, Try again
 * once rejected.
 *
 * @remarks
 * - **A live region** (`status`), so a screen reader announces a decision or a
 *   withdrawal on this platform.
 */
export const CreatorLinkedRow = ({ claim, isBusy, onRemove, onTryAgain }: CreatorLinkedRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().creators.account;
  const { tag, status } = claim;
  const approved = status === CreatorStatus.Approved;
  const body =
    status === CreatorStatus.Pending
      ? copy.pendingBody
      : approved
        ? copy.approvedBody
        : copy.rejectedBody.replace('{handle}', tag.displayHandle);

  return (
    <View role="status" accessibilityLiveRegion="polite" style={styles.row}>
      <View style={styles.head}>
        <CreatorPlatformMark platform={tag.platform} size={creatorMarkGeometry.row} />
        <View style={styles.names}>
          <SizedText size={fontSizes.body} weight={fontWeights.bold}>
            {creatorPlatformName(tag.platform)}
          </SizedText>
          <SizedText size={fontSizes.caption} color={colors.textSubtle} numberOfLines={ValueConstants.one}>
            {approved ? (
              <Text
                accessibilityRole="link"
                onPress={() => void Linking.openURL(creatorProfileUrl(tag)).catch(() => undefined)}
                style={styles.link}
              >
                {tag.displayHandle}
              </Text>
            ) : (
              tag.displayHandle
            )}
          </SizedText>
        </View>
        <CreatorStatusPill claim={claim} />
      </View>
      <SizedText size={fontSizes.caption} ratio={lineHeights.normal}>
        {body}
      </SizedText>
      {status === CreatorStatus.Rejected ? (
        <CreatorRowAction label={copy.resubmit} primary loading={false} disabled={isBusy} onPress={onTryAgain} />
      ) : (
        <CreatorRowAction
          label={approved ? copy.remove : copy.withdraw}
          primary={false}
          loading={false}
          disabled={isBusy}
          onPress={onRemove}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  names: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
  },
  link: {
    textDecorationLine: 'underline',
  },
});
