import type Ionicons from '@expo/vector-icons/Ionicons';

export interface KindMeta {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}
