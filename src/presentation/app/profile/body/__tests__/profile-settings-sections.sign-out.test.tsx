/**
 * Signing out sat one tap away on a destructive-looking row and took the
 * session with it immediately — no way back from a mis-tap, and the confirm
 * copy the app already shipped (`settings.signOutConfirm`) went unused. It
 * asks first now, the way account deletion always has.
 */

import { act, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { create } from 'zustand';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { ProfileSettingsSections } from '@presentation/app/profile/body/profile-settings-sections';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import { t } from '@presentation/i18n';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: mockReplace })),
}));

// The support sheet this section also renders owns an unrelated store; stub it
// so the test stays on the sign-out row.
jest.mock('@presentation/app/profile/sheets/feedback-sheet', () => ({
  FeedbackSheet: () => null,
}));

const signOut = jest.fn<Promise<null>, []>(() => Promise.resolve(null));

const makeStores = (): Stores =>
  ({
    authStore: create<Partial<AuthStoreState>>(() => ({
      state: { status: 'unauthenticated' },
      signOut,
      deleteAccount: jest.fn<Promise<null>, []>(() => Promise.resolve(null)),
    })),
  }) as unknown as Stores;

/** The pressable carrying the given label, or undefined. */
const pressableLabelled = (root: ReactTestInstance, label: string): ReactTestInstance | undefined =>
  root.findAll(
    (node) =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.onPress === 'function' &&
      (node.props.accessibilityLabel === label ||
        textContent(node).includes(label)),
  )[0];

describe('ProfileSettingsSections — sign out', () => {
  let renderer: ReactTestRenderer | undefined;

  beforeEach(() => {
    signOut.mockClear();
    mockReplace.mockClear();
  });

  afterEach(async () => {
    act(() => {
      renderer?.unmount();
    });
    renderer = undefined;
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  const render = (): ReactTestInstance => {
    const result = renderComponent(
      <StoresProvider value={makeStores()}>
        <ProfileSettingsSections />
      </StoresProvider>,
    );
    renderer = result.renderer;
    return result.root;
  };

  it('asks before dropping the session', () => {
    const root = render();

    act(() => {
      (pressableLabelled(root, t().settings.signOut)?.props.onPress as () => void)();
    });

    expect(signOut).not.toHaveBeenCalled();
    expect(textContent(root)).toContain(t().settings.signOutConfirm);
  });

  it('signs out once the prompt is confirmed', async () => {
    const root = render();

    act(() => {
      (pressableLabelled(root, t().settings.signOut)?.props.onPress as () => void)();
    });
    // The sheet's confirm carries the same label as the row that opened it, so
    // take the last one — the one inside the sheet.
    const confirms = root.findAll(
      (node) =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function' &&
        textContent(node).includes(t().settings.signOut),
    );
    await act(async () => {
      (confirms[confirms.length - 1]?.props.onPress as () => void)();
      await Promise.resolve();
    });

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
