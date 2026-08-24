import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/**
 * The part of a FlatList / ScrollView / SectionList the assistant uses.
 *
 * Unexported and structural on purpose: it describes what the three lists have
 * in common rather than naming one of them, so the same props attach to any of
 * them. A `RefObject` typed to one list class would not, which is why the ref
 * below is a callback — a callback ref accepts the wider shape.
 */
interface AssistantScrollHandle {
  scrollToOffset?: (options: { offset: number; animated?: boolean }) => void;
  scrollTo?: (options: { y: number; animated?: boolean }) => void;
  /**
   * `unknown`, because each list types its responder differently and the
   * narrowest of them would exclude the others — the caller asks whether the
   * thing it got back can scroll, which is the only property it uses.
   */
  getScrollResponder?: () => unknown;
}

/**
 * What a screen spreads onto the list it wants the assistant to be able to
 * move: `<FlatList {...scrollable} />`.
 */
export interface AssistantScrollableProps {
  ref: (instance: AssistantScrollHandle | null) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle: number;
}
