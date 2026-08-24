import type { Ionicons } from '@expo/vector-icons';

/**
 * One choice the orb offers when it is tapped.
 *
 * Exported because the surface that owns the orb builds the list — what the
 * choices ARE is a question about the session, not about how a pill is drawn.
 */
export interface AssistantOrbMenuItem {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  /** Filled rather than outlined — the state this control is currently IN. */
  isOn?: boolean;
  isDanger?: boolean;
  onPress: () => void;
}
