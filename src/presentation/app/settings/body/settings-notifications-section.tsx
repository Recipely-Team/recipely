import { StyleSheet, View } from 'react-native';
import { SectionHeader } from '@presentation/base/widgets/text/section-header';
import { SettingsRow } from '@presentation/base/widgets/settings/settings-row';
import { SettingsSwitch } from '@presentation/base/widgets/settings/settings-switch';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii } from '@presentation/base/theme';
import { useRemindersSetting } from '@presentation/app/settings/hooks/use-reminders-setting';
import { isWeb } from '@infrastructure/constants/platform';
import { t } from '@presentation/i18n';

/**
 * Notification preferences: today the come-back reminders switch. Native only; the web sends no
 * local notifications.
 *
 * @remarks
 * - **TODO(design):** built from the existing settings row and switch while Claude Design is
 *   unavailable; redraw it in the prototype and check it back.
 */
export const SettingsNotificationsSection = (): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const reminders = useRemindersSetting();
  if (isWeb()) return null;
  return (
    <>
      <SectionHeader title={t().reminders.section} />
      <View style={[styles.group, { backgroundColor: colors.cardBackground }]}>
        <SettingsRow
          icon="notifications-outline"
          label={t().reminders.setting}
          showChevron={false}
          onPress={() => reminders.onChange(!reminders.enabled)}
          rightElement={
            <SettingsSwitch
              value={reminders.enabled}
              disabled={reminders.busy}
              accessibilityLabel={t().reminders.setting}
              onChange={reminders.onChange}
            />
          }
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  group: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
  },
});
