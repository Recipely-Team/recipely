// eslint-disable-next-line no-restricted-imports -- the one place the native Pressable is wrapped
import { Pressable as NativePressable, type GestureResponderEvent, type PressableProps as NativePressableProps, type View } from 'react-native';
import { CharConstants } from '@core/constants';
import { ScreenElementKind } from '@domain/assistant/screen/screen-element-kind';
import { useScreenElement } from '@presentation/base/hooks/assistant/screen/use-screen-element';
import { textOfChildren } from '@presentation/base/hooks/assistant/screen/text-of-children';

export interface PressableProps extends NativePressableProps {
  ref?: React.Ref<View>;
}

/** What a handler receives when the assistant presses: no touch, and nothing to stop. */
const ASSISTANT_PRESS = {
  nativeEvent: {},
  stopPropagation: () => undefined,
  preventDefault: () => undefined,
  persist: () => undefined,
} as unknown as GestureResponderEvent;

/**
 * React Native's `Pressable`, which the assistant can also see and press.
 *
 * @remarks
 * - **A drop-in.** Same name, same props, same rendering; eslint sends every
 *   `Pressable` import here, so a new button is reachable by voice the day it
 *   is written.
 * - **Its name is what a screen reader says**: the accessibility label, else
 *   the words inside it.
 * - **The assistant's press is the user's tap**: the same `onPress`, refused
 *   while disabled.
 */
export const Pressable = ({ ref, ...props }: PressableProps): React.JSX.Element => {
  useScreenElement(ScreenElementKind.Control, () => ({
    label:
      props.accessibilityLabel ??
      props['aria-label'] ??
      (typeof props.children === 'function' ? CharConstants.empty : textOfChildren(props.children, true)),
    isEnabled: props.disabled !== true && props.accessibilityState?.disabled !== true && props.onPress != null,
    press: () => props.onPress?.(ASSISTANT_PRESS),
  }));
  return <NativePressable ref={ref} {...props} />;
};
