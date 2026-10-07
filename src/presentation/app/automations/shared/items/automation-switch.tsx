import { SettingsSwitch } from '@presentation/base/widgets/settings/settings-switch';
import { t } from '@presentation/i18n';

export interface AutomationSwitchProps {
  value: boolean;
  disabled: boolean;
  onChange: (enabled: boolean) => void;
}

/** A rule's on/off switch (spec: primary track when on); announced as "Automation on". */
export const AutomationSwitch = ({ value, disabled, onChange }: AutomationSwitchProps): React.JSX.Element => (
  <SettingsSwitch
    value={value}
    disabled={disabled}
    accessibilityLabel={t().instagram.automationOn}
    onChange={onChange}
  />
);
