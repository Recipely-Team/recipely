import type Ionicons from '@expo/vector-icons/Ionicons';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { RoundIconButtonTone, type RoundIconButtonToneType } from '@presentation/base/widgets/buttons/round-icon-button-tone';
import { controlSizes, iconSizes } from '@presentation/base/theme';

export interface TabAppBarButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  onPress: () => void;
  /** `Primary` for the one main action a tab leads with (My Recipes' add). */
  tone?: RoundIconButtonToneType;
}

/** The only button a {@link TabAppBar} holds: a 40 outlined circle with a 20 glyph (design spec → Tab app bar). */
export const TabAppBarButton = ({ icon, accessibilityLabel, onPress, tone = RoundIconButtonTone.Outlined }: TabAppBarButtonProps): React.JSX.Element => (
  <RoundIconButton
    icon={icon}
    accessibilityLabel={accessibilityLabel}
    onPress={onPress}
    size={controlSizes.floatingBtn}
    iconSize={iconSizes.xl}
    tone={tone}
  />
);
