import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, fontSizes, lineHeights, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { SectionHeader } from '@presentation/base/widgets/text/section-header';
import { t } from '@presentation/i18n';
import { useCreatorAccount } from '@presentation/app/edit-profile/hooks/use-creator-account';
import { CreatorAccountStep } from '@presentation/app/edit-profile/model/creator-account-step';
import { CreatorClaimForm } from '@presentation/app/edit-profile/body/creator/creator-claim-form';
import { CreatorClaimCard } from '@presentation/app/edit-profile/body/creator/creator-claim-card';

/**
 * Edit Profile's "Creator account" section: the shared section header, then
 * one card in whichever of its four states the user's claim is — the form (no
 * claim, or trying again), in review, approved, rejected (design spec §7).
 *
 * @remarks
 * - **The three result states are a live region** (`status`), so a screen
 *   reader announces the change when a claim is sent, withdrawn or decided.
 */
export const CreatorAccountSection = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const vm = useCreatorAccount();
  const { view } = vm;
  const isForm = view.step === CreatorAccountStep.Form;

  return (
    <View style={styles.section}>
      <SectionHeader title={t().creators.account.title} />
      <View
        role={isForm ? undefined : 'status'}
        accessibilityLiveRegion={isForm ? 'none' : 'polite'}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      >
        {view.step === CreatorAccountStep.Form ? (
          <>
            <SizedText size={fontSizes.caption} ratio={lineHeights.normal} color={colors.text}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
});
