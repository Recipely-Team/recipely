import { useCallback, useEffect, useState } from 'react';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showWarningToast } from '@presentation/base/feedback/show-toast';
import { t } from '@presentation/i18n';

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
  const { getRemindersEnabled, setRemindersChoice } = useStores();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    void getRemindersEnabled.execute().then((on) => {
      if (live) setEnabled(on);
    });
    return () => {
      live = false;
    };
  }, [getRemindersEnabled]);

  const onChange = useCallback(
    (next: boolean): void => {
      setEnabled(next);
      setBusy(true);
      void setRemindersChoice
        .execute(next, t().reminders.messages, Date.now())
        .then((on) => {
          setEnabled(on);
          if (next && !on) showWarningToast(t().reminders.permissionDenied);
        })
        .catch(() => setEnabled(false))
        .finally(() => setBusy(false));
    },
    [setRemindersChoice],
  );

  return { enabled, busy, onChange };
};
