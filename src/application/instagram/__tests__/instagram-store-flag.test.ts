import { configureInstagramStore } from '@application/instagram/instagram-store';
import { StoreStatus } from '@application/store/store-status';
import { GetInstagramConnectionUseCase } from '@application/instagram/connect/get-instagram-connection-use-case';
import { fakeInstagramRepository } from '@application/instagram/__fixtures__/instagram-fixtures';

import { isFeatureOn } from '@application/config/is-feature-on';
import { FeatureAvailability } from '@application/config/feature-availability';

describe('isFeatureOn', () => {
  it('turns a dev-only feature on in dev builds and off in production', () => {
    expect(isFeatureOn(FeatureAvailability.DevOnly, true)).toBe(true);
    expect(isFeatureOn(FeatureAvailability.DevOnly, false)).toBe(false);
    expect(isFeatureOn(FeatureAvailability.Off, true)).toBe(false);
  });
});

describe('instagramStore with the instagramAutomations flag off', () => {
  it('reports the feature unavailable without asking the server', async () => {
    const repo = fakeInstagramRepository();
    const getConnection = new GetInstagramConnectionUseCase(repo, () => Promise.resolve(false));
    const store = configureInstagramStore({ getConnection, startLogin: { execute: jest.fn() }, finalize: { execute: jest.fn() }, disconnect: { execute: jest.fn() } } as never);
    await store.getState().load();
    const connection = store.getState().connection;
    expect(repo.getConnection).not.toHaveBeenCalled();
    expect(connection.status === StoreStatus.Loaded && connection.connection.isAvailable).toBe(false);
  });
});
