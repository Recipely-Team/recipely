import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AssistantStatus, type AssistantStatusType } from '@application/assistant/session/assistant-status';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { controlSizes, iconSizes, radii } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface AssistantMicOrbProps {
  status: AssistantStatusType;
}

/**
 * The round state indicator on the pill.
 *
 * Colour carries the state and the icon repeats it, because colour alone is
 * not a signal every user receives — and the two states a user must be able to
 * tell apart instantly are "the microphone is open" and "it is not".
 */
export const AssistantMicOrb = ({ status }: AssistantMicOrbProps): React.JSX.Element => {
  const { colors } = useTheme();

  const isOpen = status === AssistantStatus.Listening || status === AssistantStatus.Speaking;
  const background = isOpen ? colors.primary : colors.chipBackground;
  const icon = status === AssistantStatus.Speaking ? 'volume-high' : 'mic';

  return (
    <View style={[styles.orb, { backgroundColor: background }]}>
      <Ionicons
        name={icon}
        size={iconSizes.sm}
        color={isOpen ? colors.primaryText : colors.textMuted}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // A pinned size is right here: this is a shape, not a box with text in it.
  orb: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: ValueConstants.zero,
  },
});
