/**
 * Unit tests for `useDragToDismiss`, driven through a probe component (react-
 * test-renderer has no `renderHook`), same pattern as `use-guest-gate.test.tsx`.
 *
 * The release/dismiss decision itself (tap vs. cleared-threshold drag vs.
 * snap-back) is covered exhaustively and in isolation by
 * `should-dismiss-drag.test.ts`. What's left to prove here is that the real
 * `PanResponder` wiring reaches `onClose`.
 *
 * We only exercise `onResponderRelease` directly (skipping
 * `onResponderGrant`/`onResponderMove`): those two compute `gestureState`'s
 * `dx`/`dy`/`vx`/`vy` from RN's internal touch-history "touch bank"
 * (`event.touchHistory`, consumed by `TouchHistoryMath`) which isn't part of
 * the public API and isn't practical to hand-construct in a jsdom test — see
 * `PanResponder.js`'s `_updateGestureStateOnMove`. Calling `onResponderRelease`
 * on its own (as this test does) exercises the untouched, zeroed
 * `gestureState` PanResponder starts with, i.e. exactly the "tap, no
 * recorded movement" path — a real release through the real wiring, just not
 * a dragged one. The dragged-and-released path is covered at the decision-
 * function level instead.
 */

import { act } from 'react-test-renderer';
import type { GestureResponderEvent } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useDragToDismiss } from '@presentation/base/hooks/interaction/use-drag-to-dismiss';
import type { UseDragToDismissResult } from '@presentation/base/hooks/interaction/use-drag-to-dismiss-result';

const NOOP_EVENT = {} as GestureResponderEvent;

const driveHook = (
  onClose: () => void,
  visible: boolean,
): { latest: () => UseDragToDismissResult; update: (nextVisible: boolean) => void } => {
  let latest!: UseDragToDismissResult;
  const Probe = ({ v }: { v: boolean }): null => {
    latest = useDragToDismiss(onClose, v);
    return null;
  };

  const { renderer } = renderComponent(<Probe v={visible} />);
  return {
    latest: () => latest,
    update: (nextVisible: boolean) => {
      act(() => renderer.update(<Probe v={nextVisible} />));
    },
  };
};

describe('useDragToDismiss', () => {
  it('claims the responder immediately so a plain tap on the grabber is caught', () => {
    const { latest } = driveHook(jest.fn(), true);

    expect(latest().panHandlers.onStartShouldSetResponder?.(NOOP_EVENT)).toBe(true);
  });

  it('calls onClose on release with no recorded movement (a plain tap)', () => {
    const onClose = jest.fn();
    const { latest } = driveHook(onClose, true);

    act(() => {
      latest().panHandlers.onResponderRelease?.(NOOP_EVENT);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  /** Reads the current value via the public `stopAnimation` callback (fires synchronously — we never attach the native driver here). */
  const readValue = (translateY: UseDragToDismissResult['translateY']): number => {
    let current = Number.NaN;
    translateY.stopAnimation((value) => {
      current = value;
    });
    return current;
  };

  it('resets translateY to 0 once the sheet becomes visible again', () => {
    const onClose = jest.fn();
    const { latest, update } = driveHook(onClose, true);

    act(() => {
      latest().translateY.setValue(120);
    });
    expect(readValue(latest().translateY)).toBe(120);

    update(false);
    update(true);

    expect(readValue(latest().translateY)).toBe(0);
  });
});
