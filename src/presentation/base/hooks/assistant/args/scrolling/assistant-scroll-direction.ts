/**
 * Which way the assistant was asked to move the screen.
 *
 * A direction rather than a distance: "scroll down" is what a person says, and
 * a pixel count is neither something they could judge nor something the model
 * could guess. `top` and `bottom` are separate because "go back to the top" is
 * a common request and a stream of `down` steps serves it badly.
 */
export const AssistantScrollDirection = {
  Up: 'up',
  Down: 'down',
  Top: 'top',
  Bottom: 'bottom',
} as const;

export type AssistantScrollDirectionType = (typeof AssistantScrollDirection)[keyof typeof AssistantScrollDirection];
