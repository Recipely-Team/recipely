import { fail, ok } from '@core/result/result-helpers';
import { NetworkFailure } from '@core/failure';
import { StoreStatus } from '@application/store/store-status';
import { configureUserProfileStore } from '@application/user-profile/user-profile-store';
import type { GetUserProfileUseCase } from '@application/user-profile/get-user-profile-use-case';

const storeAnswering = (answer: unknown) => {
  const execute = jest.fn().mockResolvedValue(answer);
  return { store: configureUserProfileStore({ getUserProfile: { execute } as unknown as GetUserProfileUseCase }), execute };
};

describe('userProfileStore', () => {
  it('loads the profile for the given user', async () => {
    const profile = { recipeCount: 3 };
    const { store, execute } = storeAnswering(ok(profile));
    await store.getState().load('u1');
    expect(execute).toHaveBeenCalledWith({ userId: 'u1' });
    expect(store.getState().state).toEqual({ status: StoreStatus.Loaded, profile });
  });

  it('reports a failure, and reset returns to idle', async () => {
    const failure = new NetworkFailure('offline');
    const { store } = storeAnswering(fail(failure));
    await store.getState().load('u1');
    expect(store.getState().state).toEqual({ status: StoreStatus.Error, failure });
    store.getState().reset();
    expect(store.getState().state).toEqual({ status: StoreStatus.Idle });
  });
});
