import type { ViewStyle } from 'react-native';

/** What a hero | card screen needs to lay its two panes out, from {@link useTwoPaneSplit}. */
export interface TwoPaneSplit {
  /** Render the side-by-side layout rather than the stacked one. */
  readonly isSplit: boolean;
  /** Added to the row: a gap exactly as wide as the hinge, or `null` without one. */
  readonly rowStyle: ViewStyle | null;
  /** Added to the first pane: exactly the left segment's width, or `null` without a hinge. */
  readonly firstPaneStyle: ViewStyle | null;
}
