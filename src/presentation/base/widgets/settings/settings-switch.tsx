import { Switch } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { colorAlphas } from '@presentation/base/theme';

export interface SettingsSwitchProps {
  value: boolean;
  disabled?: boolean;
  /** What the switch turns on, read by screen readers ("Recipe reminders"). */
  accessibilityLabel: string;
  onChange: (enabled: boolean) => void;
}

/** The app's on/off switch: primary track when on, muted when off. */
export const SettingsSwitch = ({
  value,
  disabled = false,
  accessibilityLabel,
  onChange,
}: SettingsSwitchProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Switch
      value={value}
      disabled={disabled}
      onValueChange={onChange}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      trackColor={{ true: colors.primary, false: `${colors.textMuted}${colorAlphas.medium}` }}
    />
  );
};
