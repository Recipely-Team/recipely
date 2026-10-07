import { AppState } from 'react-native';
import { act, create as render, type ReactTestRenderer } from 'react-test-renderer';
import { create } from 'zustand';
import { StoreStatus } from '@application/store/store-status';
import type { NotificationsStoreState } from '@application/notifications/notifications-store-state';
import { Email } from '@domain/common/email';
import { UserEntity } from '@domain/auth/user-entity';
import { authStoreOf } from '@presentation/base/test-support/auth-store-of';
import { useUnreadNotificationsSync } from '@presentation/base/hooks/sync/use-unread-notifications-sync';

/**
 * **The unread-badge poll kept firing in the background.** Its 30 s interval ignored the app
 * state, so a backgrounded app — or a hidden browser tab — asked the API for a badge nobody could
 * see, twice a minute, for as long as the process lived. A tick now polls only while active.
 */
const POLL_MS = 30_000;

const viewer = (): UserEntity => {
  const email = Email.create('cook@example.com');
  if (!email.ok) throw new Error('fixture email invalid');
  const user = UserEntity.create({ id: 'u1', email: email.value, displayName: 'Cook' });
  if (!user.ok) throw new Error('fixture user invalid');
  return user.value;
};

// React Native's jest preset mocks `AppState.currentState`, so the test pins the value itself.
const originalState = Object.getOwnPropertyDescriptor(AppState, 'currentState');
const setAppState = (value: string): void => {
  Object.defineProperty(AppState, 'currentState', { value, configurable: true });
};

const mount = (): { refreshUnread: jest.Mock; renderer: ReactTestRenderer } => {
  const refreshUnread = jest.fn(async () => undefined);
  const notificationsStore = create<NotificationsStoreState>(() => ({
    state: { status: StoreStatus.Idle },
    unreadCount: 0,
    load: jest.fn(async () => undefined),
    loadMore: jest.fn(async () => undefined),
    refreshUnread,
    markAllRead: jest.fn(async () => undefined),
    markOneRead: jest.fn(async () => undefined),
    clear: jest.fn(),
  }));
  const authStore = authStoreOf(viewer());
  const Probe = (): null => {
    useUnreadNotificationsSync(notificationsStore, authStore);
    return null;
  };
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = render(<Probe />);
  });
  return { refreshUnread, renderer };
};

describe('useUnreadNotificationsSync — the background poll', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    if (originalState !== undefined) Object.defineProperty(AppState, 'currentState', originalState);
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('skips the interval poll while the app is in the background', () => {
    const { refreshUnread, renderer } = mount();
    refreshUnread.mockClear();
    setAppState('background');

    act(() => jest.advanceTimersByTime(POLL_MS * 3));

    expect(refreshUnread).not.toHaveBeenCalled();
    act(() => renderer.unmount());
  });

  it('keeps polling while the app is in the foreground', () => {
    const { refreshUnread, renderer } = mount();
    refreshUnread.mockClear();
    setAppState('active');

    act(() => jest.advanceTimersByTime(POLL_MS * 2));

    expect(refreshUnread).toHaveBeenCalledTimes(2);
    act(() => renderer.unmount());
  });
});
