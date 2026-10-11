/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockDispatch = jest.fn();
let mockPrevent: { enabled: boolean; callback: (options: { data: { action: unknown } }) => void } | null = null;
jest.mock('expo-router', () => ({ useNavigation: () => ({ dispatch: mockDispatch }) }));
jest.mock('expo-router/react-navigation', () => ({
  usePreventRemove: (enabled: boolean, callback: (options: { data: { action: unknown } }) => void) => {
    mockPrevent = { enabled, callback };
  },
}));

import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useLeaveGuard } from '@presentation/base/hooks/navigation/use-leave-guard';

const probe = (shouldAsk: boolean, onAsk: () => void): { release: () => void } => {
  const box: { release: () => void } = { release: () => undefined };
  const Probe = (): null => {
    box.release = useLeaveGuard(shouldAsk, onAsk).release;
    return null;
  };
  renderComponent(<Probe />);
  return box;
};

describe('useLeaveGuard', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockPrevent = null;
  });

  // --- regression: the Android back gesture and the iOS swipe left create-recipe with no "Save draft / Discard".
  it('holds the back gesture while there is work, asks, and replays the gesture once released', () => {
    const onAsk = jest.fn();
    const guard = probe(true, onAsk);
    expect(mockPrevent?.enabled).toBe(true);

    act(() => mockPrevent?.callback({ data: { action: { type: 'GO_BACK' } } }));
    expect(onAsk).toHaveBeenCalledTimes(1);
    expect(mockDispatch).not.toHaveBeenCalled();

    act(() => guard.release());
    expect(mockPrevent?.enabled).toBe(false);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
  });

  it('does not hold anything when there is nothing to lose', () => {
    probe(false, jest.fn());
    expect(mockPrevent?.enabled).toBe(false);
  });
});
