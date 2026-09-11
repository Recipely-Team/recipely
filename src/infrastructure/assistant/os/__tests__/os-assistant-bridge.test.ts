import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { OsIntentId } from '@domain/assistant/os/os-intent-id';

import { OsAssistantBridge } from '@infrastructure/assistant/os/os-assistant-bridge';

// The factory is inline and the handles are fetched afterwards with
// `requireMock`. Referring to an outer `const` from the factory does not work
// here: babel hoists `jest.mock` above the imports, so the factory runs while
// the bridge is being required — before the `const` has been initialised.
//
// `__esModule` matters too. The bridge uses `import * as Kit`, and without the
// flag babel's interop wraps the whole mock under `default`, so every method
// reads as undefined and it looks like a bridge bug rather than a mock one.
jest.mock('@/modules/recipely-assistant-kit', () => ({
  __esModule: true,
  isAvailable: true,
  getPendingInvocationsAsync: jest.fn(),
  removePendingInvocationAsync: jest.fn(),
  clearPendingInvocationsAsync: jest.fn(),
  addInvocationListener: jest.fn(),
  setEntityCatalogAsync: jest.fn(),
  refreshShortcutsAsync: jest.fn(),
  setCredentialsAsync: jest.fn(),
}));

const mockKit = jest.requireMock('@/modules/recipely-assistant-kit') as Record<
  string,
  jest.Mock
>;

const raw = (overrides: Record<string, unknown> = {}) => ({
  id: OsIntentId.SearchRecipes,
  invocationId: 'inv-1',
  action: AssistantAction.Search,
  arg: 'mercimek',
  at: 1_700_000_000_000,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockKit.getPendingInvocationsAsync.mockResolvedValue([]);
  mockKit.removePendingInvocationAsync.mockResolvedValue(undefined);
  mockKit.setEntityCatalogAsync.mockResolvedValue(undefined);
  mockKit.refreshShortcutsAsync.mockResolvedValue(undefined);
  mockKit.setCredentialsAsync.mockResolvedValue(undefined);
});

describe('OsAssistantBridge — the boundary refuses what it cannot run', () => {
  it('passes a request whose id and action this build knows', async () => {
    mockKit.getPendingInvocationsAsync.mockResolvedValue([raw()]);

    await expect(new OsAssistantBridge().pendingInvocations()).resolves.toEqual([
      {
        id: OsIntentId.SearchRecipes,
        invocationId: 'inv-1',
        action: AssistantAction.Search,
        arg: 'mercimek',
        at: 1_700_000_000_000,
      },
    ]);
  });

  // An intent was compiled into a build that may be older or newer than the
  // JavaScript reading it, so the native side hands over bare strings. A word
  // the registry would only answer `unknown_action` for is dropped here, or the
  // user hears the app deny something the system had just offered them.
  it('drops a request naming an action this build does not have', async () => {
    mockKit.getPendingInvocationsAsync.mockResolvedValue([raw({ action: 'writeBio' })]);

    await expect(new OsAssistantBridge().pendingInvocations()).resolves.toEqual([]);
  });

  // "Ask Recipely" now carries whatever word the backend chose. A `confirm`
  // would answer a sheet left pending in the app — one nobody can see from Siri.
  it.each([AssistantAction.Confirm, AssistantAction.Cancel])(
    'drops %s, which only answers a sheet the user is looking at',
    async (action) => {
      mockKit.getPendingInvocationsAsync.mockResolvedValue([
        raw({ id: OsIntentId.AskRecipely, action, arg: undefined }),
      ]);

      await expect(new OsAssistantBridge().pendingInvocations()).resolves.toEqual([]);
    },
  );

  // The caller never sees a dropped entry, so it can never acknowledge one. Left
  // in the queue it was re-read and re-dropped on every launch.
  it('removes what it drops from the queue, and keeps what it passes', async () => {
    mockKit.getPendingInvocationsAsync.mockResolvedValue([
      raw({ invocationId: 'unknown', action: 'writeBio' }),
      raw({ invocationId: 'kept' }),
    ]);

    await new OsAssistantBridge().pendingInvocations();

    expect(mockKit.removePendingInvocationAsync.mock.calls).toEqual([['unknown']]);
  });

  it('drops a request whose catalogue id it has never heard of', async () => {
    mockKit.getPendingInvocationsAsync.mockResolvedValue([raw({ id: 'orderGroceries' })]);

    await expect(new OsAssistantBridge().pendingInvocations()).resolves.toEqual([]);
  });

  // The one entry with no fixed action is answered natively; if it ever does
  // reach JavaScript it must survive the boundary rather than be mistaken for
  // an unknown word.
  it('keeps a request that deliberately carries no action', async () => {
    mockKit.getPendingInvocationsAsync.mockResolvedValue([
      raw({ id: OsIntentId.AskRecipely, action: null }),
    ]);

    const [invocation] = await new OsAssistantBridge().pendingInvocations();

    expect(invocation?.action).toBeNull();
  });

  // The native side OMITS the key rather than storing a null: `UserDefaults`
  // takes property lists and `NSNull` is not one, so writing a null there kills
  // the process. An omitted key reads back as `undefined`, and compared against
  // `null` the flagship "Ask Recipely" request was dropped at the boundary.
  it('treats an omitted action the same as an explicit null', async () => {
    const { action: _action, arg: _arg, ...withoutOptionals } = raw({
      id: OsIntentId.AskRecipely,
    });
    mockKit.getPendingInvocationsAsync.mockResolvedValue([withoutOptionals]);

    const [invocation] = await new OsAssistantBridge().pendingInvocations();

    expect(invocation).toEqual(
      expect.objectContaining({ id: OsIntentId.AskRecipely, action: null, arg: null }),
    );
  });

  it('applies the same filter to live invocations', () => {
    const listener = jest.fn();
    mockKit.addInvocationListener.mockImplementation(() => () => undefined);

    new OsAssistantBridge().subscribe(listener);
    const emit = mockKit.addInvocationListener.mock.calls[0][0];
    emit(raw({ action: 'writeBio' }));
    emit(raw());

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ action: AssistantAction.Search }));
  });
});

describe('OsAssistantBridge — publishing downwards', () => {
  // Writing the catalogue is only half of it on Android: a recipe the user can
  // name out loud has to become a shortcut, and nothing republishes them on
  // its own.
  it('refreshes the shortcuts after replacing the catalogue', async () => {
    const order: string[] = [];
    mockKit.setEntityCatalogAsync.mockImplementation(async () => void order.push('catalogue'));
    mockKit.refreshShortcutsAsync.mockImplementation(async () => void order.push('shortcuts'));

    await new OsAssistantBridge().publishRecipes([{ id: 'r1', title: 'Köfte', subtitle: null }]);

    expect(order).toEqual(['catalogue', 'shortcuts']);
    expect(mockKit.setEntityCatalogAsync).toHaveBeenCalledWith('recipe', [
      { id: 'r1', title: 'Köfte', subtitle: null },
    ]);
  });

  // A sign-out has to withdraw the ability to ask on the user's behalf, and a
  // null token is how that is said.
  it('carries a withdrawn token through unchanged', async () => {
    await new OsAssistantBridge().publishCredentials(null, 'tr');

    expect(mockKit.setCredentialsAsync).toHaveBeenCalledWith({ token: null, languageCode: 'tr' });
  });
});
