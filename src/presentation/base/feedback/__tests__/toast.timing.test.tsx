import { AccessibilityInfo } from 'react-native';
import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { Toast } from '@presentation/base/feedback/toast';
import type { ToastItem } from '@presentation/base/feedback/toast-item';
import { ACTION_TOAST_DURATION_MS, DEFAULT_TOAST_DURATION_MS } from '@presentation/base/feedback/toast-model';

jest.mock('@infrastructure/constants/platform', () => ({
  isIos: () => true,
  isWeb: () => false,
  isAndroid: () => false,
}));

const item = (overrides: Partial<ToastItem>): ToastItem =>
  ({ id: 't1', message: 'Added to shopping list', severity: 'success', ...overrides }) as ToastItem;

/**
 * Reported as: "the View button is gone before I can reach it", and "VoiceOver
 * never says the save failed." Action toasts vanished after 4 s (WCAG 2.2.1),
 * and toasts were announced only through Android's live region.
 */
describe('Toast — reachable and spoken', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('keeps a toast with a button past the plain-toast duration', () => {
    const onDismiss = jest.fn();
    renderComponent(<Toast item={item({ actionLabel: 'View', onAction: jest.fn() })} onDismiss={onDismiss} />);

    act(() => jest.advanceTimersByTime(DEFAULT_TOAST_DURATION_MS + 1));
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(ACTION_TOAST_DURATION_MS));
    act(() => jest.runOnlyPendingTimers());
    expect(onDismiss).toHaveBeenCalledWith('t1');
  });

  it('announces its message to VoiceOver', () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
    renderComponent(<Toast item={item({})} onDismiss={jest.fn()} />);

    expect(announce).toHaveBeenCalledWith('Added to shopping list');
    announce.mockRestore();
  });
});
