import { PanResponder, type PanResponderCallbacks, type PanResponderGestureState } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useHorizontalSwipe } from '@presentation/base/hooks/interaction/use-horizontal-swipe';

/**
 * **Swipe to page.** Drives the callbacks the hook hands to `PanResponder.create`, since a test
 * renderer cannot produce a real touch: a left swipe pages forward, a right swipe back, a short or
 * mostly vertical drag does nothing (so a scroll is never stolen).
 */
const THRESHOLD = 60;

const swipe = (onPage: jest.Mock): PanResponderCallbacks => {
  const create = jest.spyOn(PanResponder, 'create');
  const Probe = (): null => {
    useHorizontalSwipe(onPage, THRESHOLD);
    return null;
  };
  renderComponent(<Probe />);
  const config = create.mock.calls.at(-1)?.[0];
  create.mockRestore();
  if (config === undefined) throw new Error('PanResponder.create was not called');
  return config;
};

const gesture = (dx: number, dy = 0): PanResponderGestureState => ({ dx, dy }) as PanResponderGestureState;
const event = {} as Parameters<NonNullable<PanResponderCallbacks['onPanResponderRelease']>>[0];

describe('useHorizontalSwipe', () => {
  it('pages forward on a long swipe to the left and back on one to the right', () => {
    const onPage = jest.fn();
    const config = swipe(onPage);

    config.onPanResponderRelease?.(event, gesture(-THRESHOLD - 1));
    config.onPanResponderRelease?.(event, gesture(THRESHOLD + 1));

    expect(onPage.mock.calls).toEqual([[1], [-1]]);
  });

  it('ignores a swipe that does not pass the threshold', () => {
    const onPage = jest.fn();

    swipe(onPage).onPanResponderRelease?.(event, gesture(-THRESHOLD));

    expect(onPage).not.toHaveBeenCalled();
  });

  it('claims a mostly horizontal drag past half the threshold, but leaves a vertical one to the scroll', () => {
    const claims = swipe(jest.fn()).onMoveShouldSetPanResponder;

    expect(claims?.(event, gesture(THRESHOLD / 2 + 1, 5))).toBe(true);
    expect(claims?.(event, gesture(THRESHOLD / 2, 0))).toBe(false);
    expect(claims?.(event, gesture(40, 80))).toBe(false);
  });
});
