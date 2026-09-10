interface Recorded {
  ran: { action: string; arg: string | undefined }[];
  acknowledged: string[];
  queue: unknown[];
  pendingLink: { action: string; arg: string | null } | null;
  failAcknowledge: boolean;
  failPending: boolean;
  holdRun: (() => void) | null;
}

const mockState: Recorded = {
  ran: [],
  acknowledged: [],
  queue: [],
  pendingLink: null,
  failAcknowledge: false,
  failPending: false,
  holdRun: null,
};

const mockAppStateListeners: ((next: string) => void)[] = [];

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: (_event: string, listener: (next: string) => void) => {
      mockAppStateListeners.push(listener);
      return { remove: () => undefined };
    },
  },
}));

jest.mock('@presentation/navigation/pending-os-intent', () => ({
  PendingOsIntent: {
    take: () => {
      const held = mockState.pendingLink;
      mockState.pendingLink = null;
      return held;
    },
  },
}));

jest.mock('@presentation/bootstrap/use-stores', () => ({
  useStores: () => ({
    assistantActionRegistry: {
      run: async (action: string, arg: string | undefined) => {
        mockState.ran.push({ action, arg });
        if (mockState.holdRun !== null) {
          await new Promise<void>((resolve) => {
            mockState.holdRun = resolve;
          });
        }
        return { ok: true };
      },
    },
    osAssistant: {
      pendingInvocations: async () => {
        if (mockState.failPending) throw new Error('bridge unavailable');
        return mockState.queue;
      },
      acknowledge: async (id: string) => {
        if (mockState.failAcknowledge) throw new Error('bridge unavailable');
        mockState.acknowledged.push(id);
      },
      subscribe: () => () => undefined,
    },
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useOsAssistantInvocations } = require('@presentation/base/hooks/assistant/os/use-os-assistant-invocations') as typeof import('@presentation/base/hooks/assistant/os/use-os-assistant-invocations');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createElement } = require('react') as typeof import('react');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { act, create } = require('react-test-renderer') as typeof import('react-test-renderer');

const invocation = (invocationId: string, action = 'search', arg: string | null = 'corba') => ({
  id: 'searchRecipes',
  invocationId,
  action,
  arg,
  at: 1,
});

const Probe = (): null => {
  useOsAssistantInvocations();
  return null;
};

const mount = async (): Promise<void> => {
  await act(async () => {
    create(createElement(Probe));
  });
};

const foreground = async (): Promise<void> => {
  await act(async () => {
    for (const listener of mockAppStateListeners) listener('active');
  });
};

beforeEach(() => {
  mockState.ran = [];
  mockState.acknowledged = [];
  mockState.queue = [];
  mockState.pendingLink = null;
  mockState.failAcknowledge = false;
  mockState.failPending = false;
  mockState.holdRun = null;
  mockAppStateListeners.length = 0;
});

describe('useOsAssistantInvocations — draining what the OS left behind', () => {
  it('runs a queued request and then forgets it', async () => {
    mockState.queue = [invocation('inv-1')];

    await mount();

    expect(mockState.ran).toEqual([{ action: 'search', arg: 'corba' }]);
    expect(mockState.acknowledged).toEqual(['inv-1']);
  });

  it('runs the link a launcher shortcut arrived with', async () => {
    mockState.pendingLink = { action: 'refresh', arg: null };

    await mount();

    expect(mockState.ran).toEqual([{ action: 'refresh', arg: undefined }]);
  });

  it('runs a request that deliberately carries no action not at all, but still forgets it', async () => {
    mockState.queue = [invocation('inv-1', null as unknown as string)];

    await mount();

    expect(mockState.ran).toEqual([]);
    expect(mockState.acknowledged).toEqual(['inv-1']);
  });
});

describe('useOsAssistantInvocations — a second drain must not repeat the first', () => {
  // Reading the queue does not empty it and an entry is acknowledged only after
  // its action finishes, so a drain entering while another awaits a handler
  // would find the same entry and run it twice. Returning from the Siri
  // overlay, Control Centre or a permission sheet raises `active` every time.
  it('ignores a foreground that arrives while a drain is still running', async () => {
    mockState.queue = [invocation('inv-1')];
    mockState.holdRun = () => undefined;

    await mount();
    await foreground();

    expect(mockState.ran).toHaveLength(1);
  });

  it('drains again once the first one has finished', async () => {
    mockState.queue = [invocation('inv-1')];

    await mount();
    mockState.queue = [invocation('inv-2', 'refresh', null)];
    await foreground();

    expect(mockState.acknowledged).toEqual(['inv-1', 'inv-2']);
  });
});

describe('useOsAssistantInvocations — a failing bridge must not strand the queue', () => {
  // An acknowledge that rejects used to abort the loop, leaving every entry
  // behind it both undispatched and unacknowledged — so one bad request became
  // permanent for the rest of them too.
  it('keeps dispatching the rest when an acknowledge rejects', async () => {
    mockState.queue = [invocation('inv-1'), invocation('inv-2', 'refresh', null)];
    mockState.failAcknowledge = true;

    await mount();

    expect(mockState.ran).toEqual([
      { action: 'search', arg: 'corba' },
      { action: 'refresh', arg: undefined },
    ]);
  });

  it('survives a queue it cannot even read, and tries again next time', async () => {
    mockState.failPending = true;

    await mount();

    mockState.failPending = false;
    mockState.queue = [invocation('inv-1')];
    await foreground();

    expect(mockState.acknowledged).toEqual(['inv-1']);
  });
});
