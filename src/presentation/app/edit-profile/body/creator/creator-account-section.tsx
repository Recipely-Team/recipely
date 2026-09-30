import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, fontSizes, fontWeights, lineHeights, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { t } from '@presentation/i18n';
import { useCreatorAccount } from '@presentation/app/edit-profile/hooks/use-creator-account';
import { CreatorAccountStep } from '@presentation/app/edit-profile/model/creator-account-step';
import { CreatorStatusPill } from '@presentation/app/edit-profile/items/creator-status-pill';
import { CreatorClaimForm } from '@presentation/app/edit-profile/body/creator/creator-claim-form';
import { CreatorClaimCard } from '@presentation/app/edit-profile/body/creator/creator-claim-card';

/**
 * Edit Profile's "Creator account" card, in whichever of its four states the
 * user's claim is: the form (no claim, or editing one), in review, approved,
 * refused. The heading carries the status pill once there is a claim.
 */
export const CreatorAccountSection = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const vm = useCreatorAccount();
  const { view } = vm;

  return (
    <View
      accessibilityLabel={t().creators.account.title}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
    >
      <View style={styles.heading}>
        <SizedText size={fontSizes.heading} weight={fontWeights.bold} accessibilityRole="header">
          {t().creators.account.title}
        </SizedText>
        {view.step !== CreatorAccountStep.Form ? <CreatorStatusPill step={view.step} /> : null}
      </View>
      {view.step === CreatorAccountStep.Form ? (
        <>
          <SizedText size={fontSizes.caption} ratio={lineHeights.normal} color={colors.textSubtle}>
            {t().creators.account.intro}
          </SizedText>
          <CreatorClaimForm
            platform={view.platform}
            handle={view.handle}
            error={view.error}
            canCancel={view.canCancel}
            isBusy={vm.isBusy}
            onPickPlatform={vm.onPickPlatform}
            onChangeHandle={vm.onChangeHandle}
            onSubmit={vm.onSubmit}
            onCancel={vm.onCancelEdit}
          />
        </>
      ) : (
        <CreatorClaimCard step={view.step} tag={view.tag} isBusy={vm.isBusy} onEdit={vm.onEdit} onRemove={vm.onRemove} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
