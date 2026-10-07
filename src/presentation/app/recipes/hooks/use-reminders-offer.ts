import { useCallback, useEffect, useState } from 'react';
import { useStores } from '@presentation/bootstrap/use-stores';
import { isWeb } from '@infrastructure/constants/platform';
import { showWarningToast } from '@presentation/base/feedback/show-toast';
import { t } from '@presentation/i18n';

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
export const useRemindersOffer = (blocked: boolean): RemindersOffer => {
  const { shouldOfferReminders, setRemindersChoice } = useStores();
  const [offered, setOffered] = useState(false);

  useEffect(() => {
    if (isWeb()) return undefined;
    let live = true;
    void shouldOfferReminders
      .execute(Date.now())
      .then((ask: boolean) => {
        if (live) setOffered(ask);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [shouldOfferReminders]);

  const answer = useCallback(
    (yes: boolean): void => {
      setOffered(false);
      void setRemindersChoice
        .execute(yes, t().reminders.messages, Date.now())
        .then((on) => {
          if (yes && !on) showWarningToast(t().reminders.permissionDenied);
        })
        .catch(() => undefined);
    },
    [setRemindersChoice],
  );

  return { visible: offered && !blocked, onAccept: () => answer(true), onDecline: () => answer(false) };
};
