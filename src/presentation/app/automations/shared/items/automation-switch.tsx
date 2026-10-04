import { Switch } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { colorAlphas } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface AutomationSwitchProps {
  value: boolean;
  disabled: boolean;
  onChange: (enabled: boolean) => void;
}

/** A rule's on/off switch (spec: primary track when on); announced as "Automation on". */
export const AutomationSwitch = ({ value, disabled, onChange }: AutomationSwitchProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Switch
      value={value}
      disabled={disabled}
      onValueChange={onChange}
      accessibilityRole="switch"
      accessibilityLabel={t().instagram.automationOn}
      accessibilityState={{ checked: value, disabled }}
      trackColor={{ true: colors.primary, false: `${colors.textMuted}${colorAlphas.medium}` }}
    />
  );
};
