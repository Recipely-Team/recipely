/**
 * Unit tests for `useScrollToEndOnKeyboard`, driven through a probe component
 * (react-test-renderer has no `renderHook`), same pattern as
 * `use-guest-gate.test.tsx`.
 *
 * The regression this hook exists to fix: scrolling the comment box into
 * view with a fixed 150ms timeout raced the keyboard animation, so the input
 * could stay hidden behind the keyboard depending on the scroll position.
 * These tests pin the new contract — the scroll fires only after
 * `keyboardDidShow` (or immediately when the keyboard is already up), and a
 * pending listener never leaks past unmount.
 */

import { act } from 'react-test-renderer';
import { Keyboard } from 'react-native';
import type { ScrollView } from 'react-native';
import type { RefObject } from 'react';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useScrollToEndOnKeyboard } from '@presentation/app/recipes/[recipeId]/hooks/use-scroll-to-end-on-keyboard';

// jest-expo polyfills requestAnimationFrame with setTimeout(cb, 0), so two
// awaited macrotask ticks flush the hook's double-rAF deferral.
const flushAnimationFrames = async (): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const scrollToEnd = jest.fn();
const scrollRef = { current: { scrollToEnd } as unknown as ScrollView } as RefObject<ScrollView>;

let keyboardVisible = false;
const listeners: { event: string; cb: () => void; remove: jest.Mock }[] = [];

beforeEach(() => {
  scrollToEnd.mockClear();
  listeners.length = 0;
  keyboardVisible = false;
  jest.spyOn(Keyboard, 'isVisible').mockImplementation(() => keyboardVisible);
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, cb: () => void) => {
    const sub = { event, cb, remove: jest.fn() };
    listeners.push(sub);
    return sub;
  }) as unknown as typeof Keyboard.addListener);
});

afterEach(async () => {
  // Let AppThemeProvider's async storage hydration (kicked off by
  // renderComponent) settle inside act before the environment tears down.
  await act(async () => {
    await new Promise((resolve) => setImmediate(resolve));
  });
  jest.restoreAllMocks();
});

const driveHook = (): { focus: () => void; unmount: () => void } => {
  let handler!: () => void;
  const Probe = (): null => {
    handler = useScrollToEndOnKeyboard(scrollRef);
    return null;
  };
  const { renderer } = renderComponent(<Probe />);
  return {
    focus: () => act(() => handler()),
    unmount: () => act(() => renderer.unmount()),
  };
};

describe('useScrollToEndOnKeyboard', () => {
  it('waits for keyboardDidShow before scrolling', async () => {
    const { focus } = driveHook();
    focus();

    expect(scrollToEnd).not.toHaveBeenCalled();
    expect(listeners).toHaveLength(1);
    expect(listeners[0].event).toBe('keyboardDidShow');

    act(() => listeners[0].cb());
    await flushAnimationFrames();
    expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });
  });

  it('scrolls without a listener when the keyboard is already visible', async () => {
    keyboardVisible = true;
    const { focus } = driveHook();
    focus();

    expect(listeners).toHaveLength(0);
    await flushAnimationFrames();
    expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });
  });

  it('removes a pending listener on unmount', () => {
    const { focus, unmount } = driveHook();
    focus();
    expect(listeners).toHaveLength(1);

    unmount();
    expect(listeners[0].remove).toHaveBeenCalled();
  });

  it('replaces a stale pending listener on refocus instead of stacking', () => {
    const { focus } = driveHook();
    focus();
    focus();

    expect(listeners).toHaveLength(2);
    expect(listeners[0].remove).toHaveBeenCalled();
  });
});
