import { Animated } from 'react-native';
import { act } from 'react-test-renderer';
import { SplashOverlay } from '@presentation/base/widgets/loading/splash-overlay';
import { renderComponent } from '@presentation/base/test-support/render-component';

/**
 * iOS: the welcome tour ignored "Sign in", "Create account" and "Skip" after
 * launch. The splash only unmounted when its fade reported `finished`, and a
 * fade interrupted at start-up left it mounted at opacity 0 — a full-screen,
 * invisible button that took every tap.
 */
describe('SplashOverlay', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const rootOf = (root: ReturnType<typeof renderComponent>['root']) =>
    root.findAll((n) => n.props.pointerEvents !== undefined)[0];

  it('lets touches through as soon as it starts to fade', () => {
    jest.spyOn(Animated, 'timing').mockReturnValue({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() } as never);
    const { root } = renderComponent(<SplashOverlay />);
    expect(rootOf(root)?.props.pointerEvents).toBe('auto');

    act(() => {
      jest.advanceTimersByTime(1400);
    });

    expect(rootOf(root)?.props.pointerEvents).toBe('none');
  });

  it('goes away even when the fade never reports back', () => {
    // A fade that never calls its callback: the case that left it on screen invisibly.
    jest.spyOn(Animated, 'timing').mockReturnValue({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() } as never);
    const { root } = renderComponent(<SplashOverlay />);

    act(() => {
      jest.advanceTimersByTime(1400 + 400 * 3);
    });

    expect(rootOf(root)).toBeUndefined();
  });

  it('goes away when the fade ends without finishing', () => {
    jest.spyOn(Animated, 'timing').mockReturnValue({
      start: (cb?: (r: { finished: boolean }) => void) => cb?.({ finished: false }),
      stop: jest.fn(),
      reset: jest.fn(),
    } as never);
    const { root } = renderComponent(<SplashOverlay />);

    act(() => {
      jest.advanceTimersByTime(1400);
    });

    expect(rootOf(root)).toBeUndefined();
  });
});
