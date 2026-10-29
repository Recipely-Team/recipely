import { AppState } from 'react-native';
import { act, create as render } from 'react-test-renderer';
import { Email } from '@domain/common/email';
import { UserEntity } from '@domain/auth/user-entity';
import { authStoreOf } from '@presentation/base/test-support/auth-store-of';
import { useShoppingOutboxSync } from '@presentation/base/hooks/sync/use-shopping-outbox-sync';
import { shoppingStoreOf } from '@application/shopping/__fixtures__/shopping-fixtures';

/**
 * Ticks made in a shop with no signal must reach the server without the user opening the
 * shopping list again: the outbox is sent on launch and while the app is open, signed in.
 */
const viewer = (): UserEntity => {
  const email = Email.create('cook@example.com');
  if (!email.ok) throw new Error('fixture email invalid');
  const user = UserEntity.create({ id: 'u1', email: email.value, displayName: 'Cook' });
  if (!user.ok) throw new Error('fixture user invalid');
  return user.value;
};

const originalState = Object.getOwnPropertyDescriptor(AppState, 'currentState');

const mount = (user: UserEntity | null) => {
  const store = shoppingStoreOf();
  const syncPending = jest.spyOn(store.getState(), 'syncPending');
  const authStore = authStoreOf(user);
  const Probe = (): null => {
    useShoppingOutboxSync(store, authStore);
    return null;
  };
  act(() => {
    render(<Probe />);
  });
  return { syncPending };
};

describe('useShoppingOutboxSync', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    if (originalState !== undefined) Object.defineProperty(AppState, 'currentState', originalState);
    jest.useRealTimers();
  });

  it('sends on launch and again each minute while the app is in the foreground', () => {
    Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
    const { syncPending } = mount(viewer());
    expect(syncPending).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(syncPending).toHaveBeenCalledTimes(2);
  });

  it('does nothing while signed out', () => {
    const { syncPending } = mount(null);
    expect(syncPending).not.toHaveBeenCalled();
  });
});
