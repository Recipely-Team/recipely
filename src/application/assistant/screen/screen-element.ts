import type { ScreenElementKind } from '@domain/assistant/screen/screen-element-kind';

/**
 * One piece of the UI the assistant may read or press, as the UI registered it.
 *
 * @remarks
 * - **Everything is read when asked**, never stored: a label, a disabled state
 *   and a handler change with every render, and the registry holds the getters.
 * - **`isVisible` answers for the screen it sits on.** A screen under the stack
 *   stays mounted; its text is not on screen and must not be read or pressed.
 */
export interface ScreenElement {
  readonly kind: ScreenElementKind;
  label(): string;
  isVisible(): boolean;
  /** Controls only; false while the control is disabled. */
  isEnabled?(): boolean;
  /** Controls only. */
  press?(): void;
}
