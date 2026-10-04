import type { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { TabIconFamily } from '@presentation/base/widgets/navigation/tab-icon-family';

/**
 * A tab's glyph. An Ionicons glyph names its `-outline` form and fills when
 * active; a Material glyph (the chef hat) is drawn the same in both states.
 */
export type TabIconType =
  | { family: typeof TabIconFamily.Ionicons; name: keyof typeof Ionicons.glyphMap }
  | { family: typeof TabIconFamily.Material; name: keyof typeof MaterialCommunityIcons.glyphMap };
