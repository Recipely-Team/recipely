/**
 * Behavior tests for `SettingsScreen`'s delete-account flow.
 *
 * The row opens a confirmation sheet; confirming calls the auth store's
 * `deleteAccount`. On success (null) the user is routed to `/login`; on a
 * Failure the sheet stays open with an inline error and no navigation happens.
 *
 * `ConfirmSheet` is replaced by a prop-capturing probe so the test drives the
 * screen's orchestration directly (the sheet's own rendering is covered in
 * `confirm-sheet.test.tsx`). Heavy sibling widgets are stubbed to keep the
 * test focused.
 */

import { act } from 'react-test-renderer';
import { create } from 'zustand';
import type { Failure } from '@core/failure';
import { NetworkFailure } from '@core/failure';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import type { ConfirmSheetProps } from '@presentation/base/widgets/sheets/confirm-sheet';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { SettingsScreen } from '@presentation/app/settings';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import { failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { t } from '@presentation/i18n';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: mockReplace, back: jest.fn() })),
}));

let confirmSheetProps: ConfirmSheetProps | null = null;

jest.mock('@presentation/base/widgets/sheets/confirm-sheet', () => ({
  ConfirmSheet: (props: ConfirmSheetProps) => {
    confirmSheetProps = props;
    return null;
  },
}));

const unwrap = <T,>(result: { ok: boolean; value?: T }): T => {
  if (!result.ok || result.value === undefined) {
    throw new Error('Test fixture construction failed');
  }
  return result.value;
};

const buildSession = (): AuthSessionEntity => {
  const email = unwrap(Email.create('cook@example.com'));
  const user = unwrap(UserEntity.create({ id: 'user-1', email, displayName: 'Ada Lovelace' }));
  return unwrap(
    AuthSessionEntity.create({
      id: 'session-1',
      accessToken: 'access-token',
      expiresAt: new Date(Date.now() + 3_600_000),
      user,
    }),
  );
};

const makeAuthStore = (deleteAccount: jest.Mock) =>
  create<AuthStoreState>(() => ({
    state: { status: 'authenticated', session: buildSession() },
    signIn: jest.fn(),
    register: jest.fn(),
    verifyRegistration: jest.fn(),
    resendRegistrationCode: jest.fn(),
    signOut: jest.fn(),
    expireSession: jest.fn(),
    hydrate: jest.fn(),
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    uploadAvatar: jest.fn(),
    updateProfile: jest.fn(),
    deleteAccount,
  }));

const renderSettings = (
  deleteAccount: jest.Mock,
): RenderResult => {
  const stores = { authStore: makeAuthStore(deleteAccount) } as unknown as Stores;
  return renderComponent(
    <StoresProvider value={stores}>
      <SettingsScreen />
    </StoresProvider>,
  );
};

/** The composite `SettingsRow` whose rendered label matches `label`. */
const rowByLabel = (root: RenderResult['root'], label: string) =>
  root
    .findAll((node) => typeof node.props.onPress === 'function')
    .find((node) => textContent(node).includes(label));

beforeEach(() => {
  mockReplace.mockClear();
  confirmSheetProps = null;
});

describe('SettingsScreen — delete account', () => {
  it('keeps the confirmation sheet closed until the delete row is pressed', () => {
    renderSettings(jest.fn());

    expect(confirmSheetProps?.visible).toBe(false);
  });

  it('opens the confirmation sheet when the delete-account row is pressed', () => {
    const { root } = renderSettings(jest.fn());
    const row = rowByLabel(root, t().settings.deleteAccount);

    act(() => (row?.props.onPress as () => void)());

    expect(confirmSheetProps?.visible).toBe(true);
  });

  it('routes to /login and closes the sheet when deletion succeeds', async () => {
    const deleteAccount = jest.fn<Promise<Failure | null>, []>(() => Promise.resolve(null));
    const { root } = renderSettings(deleteAccount);
    act(() => (rowByLabel(root, t().settings.deleteAccount)?.props.onPress as () => void)());

    await act(async () => {
      confirmSheetProps?.onConfirm();
    });

    expect(deleteAccount).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/login');
    expect(confirmSheetProps?.visible).toBe(false);
    expect(confirmSheetProps?.error).toBeUndefined();
  });

  it('shows an inline error and does not navigate when deletion fails', async () => {
    const failure = new NetworkFailure('offline');
    const deleteAccount = jest.fn<Promise<Failure | null>, []>(() =>
      Promise.resolve(failure),
    );
    const { root } = renderSettings(deleteAccount);
    act(() => (rowByLabel(root, t().settings.deleteAccount)?.props.onPress as () => void)());

    await act(async () => {
      confirmSheetProps?.onConfirm();
    });

    expect(mockReplace).not.toHaveBeenCalled();
    expect(confirmSheetProps?.visible).toBe(true);
    expect(confirmSheetProps?.error).toBe(failureToastMessage(failure));
  });
});
