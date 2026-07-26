import type { Animated, PanResponderInstance } from 'react-native';

export interface UseDragToDismissResult {
  /** Vertical offset to apply as the sheet's `transform: [{ translateY }]`. */
  translateY: Animated.Value;
  /** Spread onto the draggable node, e.g. `<View {...panHandlers}>`. */
  panHandlers: PanResponderInstance['panHandlers'];
}
