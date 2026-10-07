import { useCallback, useEffect, useState } from 'react';
import { useStores } from '@presentation/bootstrap/use-stores';
import { t } from '@presentation/i18n';

interface RemindersSetting {
  enabled: boolean;
  busy: boolean;
  onChange: (next: boolean) => void;
}

/**
 * The Settings "Recipe reminders" switch.
 *
 * @remarks
 * - **Shows the truth:** on only with a stored yes and a granted OS permission, so a permission
 *   revoked in system settings shows as off here.
 * - **Turning on asks the OS:** a declined prompt snaps the switch back to off.
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
        .then(setEnabled)
        .finally(() => setBusy(false));
    },
    [setRemindersChoice],
  );

  return { enabled, busy, onChange };
};
