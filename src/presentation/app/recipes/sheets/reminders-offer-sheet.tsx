import { ConfirmSheet } from '@presentation/base/widgets/sheets/confirm-sheet';
import { useRemindersOffer } from '@presentation/app/recipes/hooks/use-reminders-offer';
import { t } from '@presentation/i18n';

export interface RemindersOfferSheetProps {
  /** True while another sheet or prompt owns the screen. */
  blocked: boolean;
}

/**
 * The one-time opt-in for come-back reminders. The consent wording is the App Store's condition
 * for a promotional notification (guideline 4.5.4): what is sent, how often, and where to stop it.
 *
 * @remarks
 * - **TODO(design):** the shared confirm sheet stands in until Claude Design draws this moment.
 */
export const RemindersOfferSheet = ({ blocked }: RemindersOfferSheetProps): React.JSX.Element => {
  const offer = useRemindersOffer(blocked);
  return (
    <ConfirmSheet
      visible={offer.visible}
      title={t().reminders.offerTitle}
      message={t().reminders.offerMessage}
      confirmLabel={t().reminders.offerConfirm}
      cancelLabel={t().reminders.offerDecline}
      onConfirm={offer.onAccept}
      onClose={offer.onDecline}
    />
  );
};
