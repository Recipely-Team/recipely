import { Dimensions, Keyboard, type KeyboardEvent } from 'react-native';
import { act } from 'react-test-renderer';
import { useKeyboardHeight } from '@presentation/base/hooks/interaction/use-keyboard-height';
import { renderComponent } from '@presentation/base/test-support/render-component';

/**
 * "Yazarak sor" at the largest text on Android: the assistant's text box was
 * behind the keyboard. Edge-to-edge Android reports a keyboard `height` that
 * leaves out the navigation bar under the keys, so a sheet lifted by it sat one
 * bar-height too low. The lift is measured from the keyboard's top edge.
 */
const WINDOW = 800;
const NAV_BAR = 48;
const KEYS = 300;

const keyboardShown = (screenY: number, height: number): KeyboardEvent =>
  ({ endCoordinates: { screenY, height, screenX: 0, width: 400 } }) as unknown as KeyboardEvent;

describe('useKeyboardHeight', () => {
  it('lifts by everything below the keyboard top, navigation bar included', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 400, height: WINDOW, scale: 3, fontScale: 2 });
    const listeners: Record<string, (event: KeyboardEvent) => void> = {};
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((name: string, cb: (event: KeyboardEvent) => void) => {
      listeners[name] = cb;
      return { remove: jest.fn() };
    }) as never);
    let lift = 0;
    const Probe = (): null => {
      lift = useKeyboardHeight();
      return null;
    };
    renderComponent(<Probe />);

    act(() => {
      // The keys start 348 dp from the bottom; the event's height says only 300.
      Object.values(listeners)[0]?.(keyboardShown(WINDOW - KEYS - NAV_BAR, KEYS));
    });

    expect(lift).toBe(KEYS + NAV_BAR);
  });
});
