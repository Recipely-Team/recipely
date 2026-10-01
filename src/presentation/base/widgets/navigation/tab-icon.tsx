import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CharConstants } from '@core/constants';
import { TabIconFamily } from '@presentation/base/widgets/navigation/tab-icon-family';
import type { TabIconType } from '@presentation/base/widgets/navigation/tab-icon-type';

export interface TabIconProps {
  icon: TabIconType;
  active: boolean;
  size: number;
  color: string;
}

const OUTLINE_SUFFIX = '-outline';

/** Draws a tab's glyph: the filled Ionicons form while active, the Material glyph as is. */
export const TabIcon = ({ icon, active, size, color }: TabIconProps): React.JSX.Element => {
  if (icon.family === TabIconFamily.Material) {
    return <MaterialCommunityIcons name={icon.name} size={size} color={color} />;
  }
  const name = active ? (icon.name.replace(OUTLINE_SUFFIX, CharConstants.empty) as keyof typeof Ionicons.glyphMap) : icon.name;
  return <Ionicons name={name} size={size} color={color} />;
};
