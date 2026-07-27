/**
 * `ActiveTimersBar` must not repeat a timer that's already visible inline on
 * the currently-open recipe detail screen (the prep/cook stat-card countdown,
 * or a step's inline chip) — that was the literal on-screen duplicate from
 * tester feedback. Timers for any other recipe, or shown from any other
 * screen, must still surface here so the cross-navigation/multi-timer bar
 * keeps working.
 */

import { act, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';
import { ActiveTimersBar } from '@presentation/base/widgets/timers/active-timers-bar';
import { timerStore } from '@application/timers/timer-store';
import { timersBarStore } from '@presentation/base/timers/timers-bar-store';
import type { TimerEntry } from '@application/timers/timer-entry';

let mockPathname = '/recipes/pecan-pie';

jest.mock('expo-router', () => ({
  usePathname: jest.fn(() => mockPathname),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

const makeEntry = (id: string, recipeId: string, recipeName: string): TimerEntry => ({
  id,
  recipeId,
  recipeName,
  durationSeconds: 3000,
  endTimeMs: Date.now() + 2_986_000,
  isPaused: false,
  remainingMsOnPause: 0,
  completionNotifIds: ['notif-1'],
});

describe('ActiveTimersBar — same-screen dedupe', () => {
  let renderer: ReactTestRenderer | undefined;

  afterEach(() => {
    act(() => {
      renderer?.unmount();
    });
    renderer = undefined;
    timerStore.setState({ timers: {}, hydrated: true });
    timersBarStore.setState({ collapsed: false });
  });

  it('renders nothing when the only active timer belongs to the recipe currently on screen', () => {
    mockPathname = '/recipes/pecan-pie';
    timerStore.setState({
      timers: { 'pecan-pie:cook': makeEntry('pecan-pie:cook', 'pecan-pie', 'Pecan Pie') },
    });

    renderer = renderComponent(<ActiveTimersBar />).renderer;
    const tree = renderer.toJSON();
    const children = Array.isArray(tree) ? tree : tree?.children;
    expect(children).toBeNull();
  });

  it('still shows a timer for a different recipe while viewing this recipe', () => {
    mockPathname = '/recipes/pecan-pie';
    timerStore.setState({
      timers: {
        'pecan-pie:cook': makeEntry('pecan-pie:cook', 'pecan-pie', 'Pecan Pie'),
        'apple-crumble:prep': makeEntry('apple-crumble:prep', 'apple-crumble', 'Apple Crumble'),
      },
    });

    renderer = renderComponent(<ActiveTimersBar />).renderer;
    expect(renderer.toJSON()).not.toBeNull();
  });

  it('shows every timer when not on any recipe detail screen', () => {
    mockPathname = '/my-recipes';
    timerStore.setState({
      timers: { 'pecan-pie:cook': makeEntry('pecan-pie:cook', 'pecan-pie', 'Pecan Pie') },
    });

    renderer = renderComponent(<ActiveTimersBar />).renderer;
    expect(renderer.toJSON()).not.toBeNull();
  });
});

/**
 * Reported from a tablet: a running timer parked over the onboarding CTAs with
 * no way to reach the buttons underneath. The bar already drew a grabber pill
 * that LOOKED draggable but carried no handler at all — a promise the UI never
 * kept. It now collapses the bar to a corner pill, so the countdown stays
 * visible and controllable while the content behind it becomes reachable.
 */
describe('ActiveTimersBar — collapse', () => {
  let renderer: ReactTestRenderer | undefined;

  afterEach(() => {
    act(() => {
      renderer?.unmount();
    });
    renderer = undefined;
    timerStore.setState({ timers: {}, hydrated: true });
    timersBarStore.setState({ collapsed: false });
  });

  /** The button carrying the given accessibility label, or undefined. */
  const buttonLabelled = (r: ReactTestRenderer, label: string): ReactTestInstance | undefined =>
    r.root.findAll(
      (node) =>
        node.props.accessibilityRole === 'button' &&
        node.props.accessibilityLabel === label &&
        typeof node.props.onPress === 'function',
    )[0];

  const renderBar = (): ReactTestRenderer => {
    mockPathname = '/onboarding';
    timerStore.setState({
      timers: { 'pecan-pie:cook': makeEntry('pecan-pie:cook', 'pecan-pie', 'Pecan Pie') },
    });
    return renderComponent(<ActiveTimersBar />).renderer;
  };

  it('exposes the grabber as a real collapse button', () => {
    renderer = renderBar();

    // The regression: the grabber used to be a bare View with no onPress, so
    // there was no way to get the bar out of the way at all.
    expect(buttonLabelled(renderer, t().timer.collapse)).toBeDefined();
  });

  it('swaps the bar for an expand control once collapsed', () => {
    renderer = renderBar();
    const collapse = buttonLabelled(renderer, t().timer.collapse);

    act(() => {
      (collapse?.props.onPress as () => void)();
    });

    expect(buttonLabelled(renderer, t().timer.expand)).toBeDefined();
    expect(buttonLabelled(renderer, t().timer.collapse)).toBeUndefined();
  });

  it('keeps the timer on screen while collapsed rather than hiding it outright', () => {
    renderer = renderBar();

    act(() => {
      (buttonLabelled(renderer!, t().timer.collapse)?.props.onPress as () => void)();
    });

    // Losing sight of a running countdown entirely would be worse than the
    // blocked button — the collapsed pill still reports how many are running.
    expect(renderer.toJSON()).not.toBeNull();
    expect(textContent(renderer.root)).toContain('1');
  });

  it('restores the full bar when expanded again', () => {
    renderer = renderBar();

    act(() => {
      (buttonLabelled(renderer!, t().timer.collapse)?.props.onPress as () => void)();
    });
    act(() => {
      (buttonLabelled(renderer!, t().timer.expand)?.props.onPress as () => void)();
    });

    expect(buttonLabelled(renderer, t().timer.collapse)).toBeDefined();
  });

  /**
   * The bar is parked to reach what it covers, so the choice has to outlive the
   * screen that prompted it — and, once persisted, the app launch too.
   */
  it('stays collapsed when the bar is mounted again', () => {
    renderer = renderBar();
    act(() => {
      (buttonLabelled(renderer!, t().timer.collapse)?.props.onPress as () => void)();
    });
    act(() => {
      renderer?.unmount();
    });

    renderer = renderBar();

    expect(buttonLabelled(renderer, t().timer.expand)).toBeDefined();
    expect(buttonLabelled(renderer, t().timer.collapse)).toBeUndefined();
  });

  it('names the hide control in words, not just a chevron', () => {
    renderer = renderBar();

    // The grabber line it replaced looked like decoration; testers reported the
    // bar as unhideable while a working collapse control was on screen.
    expect(textContent(renderer.root)).toContain(t().timer.collapse);
  });
});
