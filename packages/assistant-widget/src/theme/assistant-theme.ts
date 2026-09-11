/**
 * Every colour and measurement the widget draws with. Pass a partial
 * `theme` to `AssistantWidget`; anything left out keeps the default.
 */
export interface AssistantTheme {
  readonly colors: {
    /** The orb at rest and the controls' accent. */
    readonly primary: string;
    /** The glow that follows the user's voice. */
    readonly userGlow: string;
    /** The glow that follows the assistant's voice. */
    readonly assistantGlow: string;
    readonly surface: string;
    readonly text: string;
    readonly mutedText: string;
    readonly userBubble: string;
    readonly userText: string;
    readonly assistantBubble: string;
    readonly assistantText: string;
    readonly toolChip: string;
    readonly toolText: string;
    readonly danger: string;
    readonly onPrimary: string;
  };
  readonly orbSize: number;
  readonly radius: number;
  readonly spacing: number;
  readonly fontSize: number;
  readonly panelMaxHeight: number;
}
