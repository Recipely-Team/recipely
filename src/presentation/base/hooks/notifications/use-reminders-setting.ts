import { useCallback, useEffect, useState } from 'react';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ensurePushRegistration } from '@application/notifications/ensure-push-registration';
import { showWarningToast } from '@presentation/base/feedback/show-toast';
import { useTranslations } from '@presentation/i18n';

interface RemindersSetting {
  enabled: boolean;
  busy: boolean;
  onChange: (next: boolean) => void;
}

/**
 * The "Recipe reminders" switch, on Profile and on Settings.
 *
 * @remarks
 * - **Shows the truth:** on only with a stored yes and a granted OS permission, so a permission
 *   revoked in system settings shows as off here.
 * - **Turning on asks the OS:** a declined prompt, or a permission already denied for good (no
 *   prompt at all), snaps the switch back to off and says where to turn notifications on.
 */
export const useRemindersSetting = (): RemindersSetting => {
  const t = useTranslations();
  const { getRemindersEnabled, setRemindersChoice } = useStores();
  const [isEnabled, setEnabled] = useState(false);
  const [isBusy, setBusy] = useState(false);

  useEffect(() => {
    let isLive = true;
    void getRemindersEnabled.execute().then((isOn) => {
      if (isLive) setEnabled(isOn);
    });
    return () => {
      isLive = false;
    };
  }, [getRemindersEnabled]);

  const onChange = useCallback(
    (isNextEnabled: boolean): void => {
      setEnabled(isNextEnabled);
      setBusy(true);
      void setRemindersChoice
        .execute(isNextEnabled, t.reminders.messages, Date.now())
        .then((isOn) => {
          setEnabled(isOn);
          if (isOn) ensurePushRegistration();
          if (isNextEnabled && !isOn) showWarningToast(t.reminders.permissionDenied);
        })
        .catch(() => setEnabled(false))
        .finally(() => setBusy(false));
    },
    [setRemindersChoice, t],
  );

  return { enabled: isEnabled, busy: isBusy, onChange };
};
