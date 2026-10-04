import { configureInstagramStore } from '@application/instagram/instagram-store';
import { StoreStatus } from '@application/store/store-status';

describe('instagramStore with the instagramAutomations flag off', () => {
  it('reports the feature unavailable without asking the server', async () => {
    const getConnection = { execute: jest.fn() };
    const store = configureInstagramStore({ getConnection, startLogin: { execute: jest.fn() }, finalize: { execute: jest.fn() }, disconnect: { execute: jest.fn() } } as never);
    await store.getState().load();
    const connection = store.getState().connection;
    expect(getConnection.execute).not.toHaveBeenCalled();
    expect(connection.status === StoreStatus.Loaded && connection.connection.isAvailable).toBe(false);
  });
});
