import type { ViewStyle } from 'react-native';

/** The three animated layers of the "AI is cooking" showpiece. */
export interface GeneratingAnimationResult {
  /** Orbiting dots — one slow clockwise revolution. */
  orbitStyle: ViewStyle;
  /** Outer ring — the same revolution, counter-clockwise. */
  ringStyle: ViewStyle;
  /** Centre mark — a gentle breathing pulse. */
  coreStyle: ViewStyle;
}
