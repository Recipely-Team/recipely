import type { Ionicons } from '@expo/vector-icons';

/**
 * One entry in a tab bar: what it is keyed by, what it reads as, and what it
 * looks like. A descriptor, not configuration — nothing about it is optional
 * or tunable, which is what "config" would have implied.
 */
export interface TabItem<K extends string> {
  key: K;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}
