import { useCallback, useEffect, useState } from 'react';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ensurePushRegistration } from '@application/notifications/ensure-push-registration';
import { isWeb } from '@infrastructure/constants/platform';
import { showWarningToast } from '@presentation/base/feedback/show-toast';
import { useTranslations } from '@presentation/i18n';

interface RemindersOffer {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * The one-time "may we remind you?" question on the feed.
 *
 * @remarks
 * - **When:** on a return visit a day or more after the first open, never again once answered
 *   (`ShouldOfferRemindersUseCase`); native only.
 * - **Waits its turn:** hidden while another sheet or the sign-in prompt is up (`blocked`), so two
 *   sheets never stack.
 * - **Any dismissal is an answer:** "Not now" and a backdrop tap both store a no; the Settings
 *   switch is the way back, which the question itself says.
 */
export const useRemindersOffer = (isBlocked: boolean): RemindersOffer => {
  const t = useTranslations();
  const { shouldOfferReminders, setRemindersChoice } = useStores();
  const [wasOffered, setOffered] = useState(false);

  useEffect(() => {
    if (isWeb()) return undefined;
    let isLive = true;
    void shouldOfferReminders
      .execute(Date.now())
      .then((shouldAsk: boolean) => {
        if (isLive) setOffered(shouldAsk);
      })
      .catch(() => undefined);
    return () => {
      isLive = false;
    };
  }, [shouldOfferReminders]);

  const answer = useCallback(
    (isAccepted: boolean): void => {
      setOffered(false);
      void setRemindersChoice
        .execute(isAccepted, t.reminders.messages, Date.now())
        .then((isOn) => {
          if (isOn) ensurePushRegistration();
          if (isAccepted && !isOn) showWarningToast(t.reminders.permissionDenied);
        })
        .catch(() => undefined);
    },
    [setRemindersChoice, t],
  );

  return { visible: wasOffered && !isBlocked, onAccept: () => answer(true), onDecline: () => answer(false) };
};
