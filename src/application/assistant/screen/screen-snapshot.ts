/** What is on screen right now: the words in reading order, and the controls that can be pressed. */
export interface ScreenSnapshot {
  readonly texts: readonly string[];
  readonly controls: readonly string[];
}
