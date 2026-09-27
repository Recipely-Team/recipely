import { create } from 'zustand';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import type { AuthStatus } from '@application/auth/auth-status';
import { StoreStatus } from '@application/store/store-status';
import type { RecordDeviceUseCase } from '@application/device/record-device-use-case';
import { recordDeviceOnSignIn } from '@application/device/record-device-on-sign-in';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';

const authenticated: AuthStatus = {
  status: StoreStatus.Authenticated,
  session: {} as AuthSessionEntity,
};

const makeAuthStore = (initial: AuthStatus) =>
  create<AuthStoreState>(() => ({ state: initial }) as unknown as AuthStoreState);

const makeRecordDevice = (execute: jest.Mock): RecordDeviceUseCase =>
  ({ execute }) as unknown as RecordDeviceUseCase;

describe('recordDeviceOnSignIn — the device heartbeat', () => {
  it('sends a heartbeat when a stored session resolves as authenticated at start', () => {
    const store = makeAuthStore({ status: StoreStatus.Loading });
    const execute = jest.fn(() => Promise.resolve(ok(undefined)));
    recordDeviceOnSignIn(store, makeRecordDevice(execute));

    store.setState({ state: authenticated });

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('sends nothing while signed out', () => {
    const store = makeAuthStore({ status: StoreStatus.Loading });
    const execute = jest.fn(() => Promise.resolve(ok(undefined)));
    recordDeviceOnSignIn(store, makeRecordDevice(execute));

    store.setState({ state: { status: StoreStatus.Unauthenticated } });
    store.setState({ state: { status: StoreStatus.Loading } });

    expect(execute).not.toHaveBeenCalled();
  });

  it('does not repeat for a profile update that re-sets an authenticated session', () => {
    const store = makeAuthStore(authenticated);
    const execute = jest.fn(() => Promise.resolve(ok(undefined)));
    recordDeviceOnSignIn(store, makeRecordDevice(execute));

    store.setState({ state: { ...authenticated } });

    expect(execute).not.toHaveBeenCalled();
  });

  it('sends again after signing out and back in', () => {
    const store = makeAuthStore(authenticated);
    const execute = jest.fn(() => Promise.resolve(ok(undefined)));
    recordDeviceOnSignIn(store, makeRecordDevice(execute));

    store.setState({ state: { status: StoreStatus.Unauthenticated } });
    store.setState({ state: authenticated });

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('swallows a failed heartbeat — neither the Result nor a rejection reaches the user', async () => {
    const store = makeAuthStore({ status: StoreStatus.Loading });
    const rejected = jest.fn(() => Promise.reject(new Error('boom')));
    const failed = jest.fn(() => Promise.resolve(fail(new NetworkFailure('offline'))));
    recordDeviceOnSignIn(store, makeRecordDevice(rejected));
    recordDeviceOnSignIn(store, makeRecordDevice(failed));

    expect(() => store.setState({ state: authenticated })).not.toThrow();
    await Promise.resolve();

    expect(rejected).toHaveBeenCalledTimes(1);
    expect(failed).toHaveBeenCalledTimes(1);
    expect(store.getState().state.status).toBe(StoreStatus.Authenticated);
  });
});
