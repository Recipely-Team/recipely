import { Fragment } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { CharConstants, ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, fontSizes, lineHeights, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { SectionHeader } from '@presentation/base/widgets/text/section-header';
import { t } from '@presentation/i18n';
import { useCreatorAccount } from '@presentation/app/edit-profile/hooks/use-creator-account';
import { CreatorAccountRowKind } from '@presentation/app/edit-profile/model/creator-account-row-kind';
import type { CreatorAccountRowType } from '@presentation/app/edit-profile/model/creator-account-row';
import { CreatorLinkedRow } from '@presentation/app/edit-profile/body/creator/creator-linked-row';
import { CreatorLinkForm } from '@presentation/app/edit-profile/body/creator/creator-link-form';
import { CreatorAddRow } from '@presentation/app/edit-profile/items/creator-add-row';
import { CreatorPlatform, type CreatorPlatformType } from '@domain/creators/creator-platform';
import { ConfirmSheet } from '@presentation/base/widgets/sheets/confirm-sheet';
import { useInstagramAccount } from '@presentation/app/edit-profile/hooks/use-instagram-account';
import { InstagramConnectedRow } from '@presentation/app/edit-profile/body/creator/instagram-connected-row';
import { InstagramConnectRow } from '@presentation/app/edit-profile/body/creator/instagram-connect-row';

export interface CreatorAccountSectionProps {
  /** Reports where the section sits, so a `?section=creator` link can scroll to it. */
  onLayout?: (event: LayoutChangeEvent) => void;
}

const platformOf = (row: CreatorAccountRowType): CreatorPlatformType =>
  row.kind === CreatorAccountRowKind.Linked ? row.claim.tag.platform : row.platform;

/**
 * Edit Profile's "Creator account" section (design spec §7, rev 2): the
 * shared section header, then one card — the intro, a row per claimed
 * platform, and a Link row per platform still to claim, split by hairlines.
 * Each platform is reviewed on its own; one link form is open at a time.
 * Where the server offers Instagram's login, the Instagram row is Connect
 * with Instagram (the manual form one tap away) and, once linked, the
 * connected account (Instagram automations spec §1).
 */
export const CreatorAccountSection = ({ onLayout }: CreatorAccountSectionProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const vm = useCreatorAccount();
  const ig = useInstagramAccount();
  const copy = t().instagram;

  const renderRow = (row: CreatorAccountRowType): React.JSX.Element => {
    if (ig.connection.isAvailable && platformOf(row) === CreatorPlatform.Instagram) {
      if (ig.connection.isConnected) {
        return (
          <InstagramConnectedRow
            connection={ig.connection}
            phase={ig.phase}
            isBusy={ig.isDisconnecting}
            onReconnect={ig.connect}
            onDisconnect={ig.openDisconnect}
            onOpenAutomations={ig.openAutomations}
          />
        );
      }
      if (row.kind === CreatorAccountRowKind.Add) {
        return <InstagramConnectRow phase={ig.phase} onConnect={ig.connect} onManual={() => vm.onOpenForm(CreatorPlatform.Instagram)} />;
      }
    }
    switch (row.kind) {
      case CreatorAccountRowKind.Linked:
        return (
          <CreatorLinkedRow
            claim={row.claim}
            isBusy={vm.isBusy}
            onRemove={() => vm.onRemove(row.claim.tag.platform)}
            onTryAgain={() => vm.onOpenForm(row.claim.tag.platform)}
          />
        );
      case CreatorAccountRowKind.Add:
        return <CreatorAddRow platform={row.platform} disabled={vm.isBusy} onPress={vm.onOpenForm} />;
      case CreatorAccountRowKind.Form:
        return (
          <CreatorLinkForm
            platform={row.platform}
            handle={row.handle}
            error={row.error}
            isBusy={vm.isBusy}
            onChangeHandle={vm.onChangeHandle}
            onSubmit={vm.onSubmit}
            onCancel={vm.onCancel}
          />
        );
    }
  };

  return (
    <View style={styles.section} onLayout={onLayout}>
      <SectionHeader title={t().creators.account.title} />
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <SizedText size={fontSizes.caption} ratio={lineHeights.normal} style={styles.intro}>
          {t().creators.account.intro}
        </SizedText>
        {vm.rows.map((row) => (
          <Fragment key={platformOf(row)}>
            <View style={[styles.rule, { backgroundColor: colors.border }]} />
            {renderRow(row)}
          </Fragment>
        ))}
      </View>
      <ConfirmSheet
        visible={ig.isDisconnectOpen}
        title={copy.disconnectTitle}
        message={copy.disconnectQ.replace('{h}', ig.connection.username ?? CharConstants.empty)}
        confirmLabel={copy.disconnect}
        destructive
        loading={ig.isDisconnecting}
        onConfirm={ig.confirmDisconnect}
        onClose={ig.closeDisconnect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
  },
  intro: {
    padding: spacing.lg,
  },
  rule: {
    height: borderWidths.hairline,
    marginHorizontal: ValueConstants.zero,
  },
});
