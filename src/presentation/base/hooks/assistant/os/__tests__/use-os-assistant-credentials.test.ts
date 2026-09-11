interface Recorded {
  published: { token: string | null; locale: string }[];
  mints: number;
  mintResult: { ok: true; value: { token: string; expiresAt: number } } | { ok: false };
  signedIn: boolean;
  isAvailable: boolean;
}

const mockState: Recorded = {
  published: [],
  mints: 0,
  mintResult: { ok: true, value: { token: 'tok-1', expiresAt: 2 } },
  signedIn: true,
  isAvailable: true,
};

jest.mock('@presentation/i18n/use-locale', () => ({ useLocale: () => 'tr' }));

jest.mock('@presentation/bootstrap/use-stores', () => ({
  useStores: () => ({
    osAssistant: {
      get isAvailable() {
        return mockState.isAvailable;
      },
      publishCredentials: async (token: string | null, locale: string) => {
        mockState.published.push({ token, locale });
      },
    },
    assistantTokens: {
      mintIntentToken: async () => {
        mockState.mints += 1;
        return mockState.mintResult;
      },
    },
    authStore: (select: (s: unknown) => unknown) =>
      select({ state: { status: mockState.signedIn ? 'authenticated' : 'unauthenticated' } }),
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useOsAssistantCredentials } = require('@presentation/base/hooks/assistant/os/use-os-assistant-credentials') as typeof import('@presentation/base/hooks/assistant/os/use-os-assistant-credentials');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createElement } = require('react') as typeof import('react');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { act, create } = require('react-test-renderer') as typeof import('react-test-renderer');

const Probe = (): null => {
  useOsAssistantCredentials();
  return null;
};

const mount = async (): Promise<void> => {
  await act(async () => {
    create(createElement(Probe));
  });
};

beforeEach(() => {
  mockState.published = [];
  mockState.mints = 0;
  mockState.mintResult = { ok: true, value: { token: 'tok-1', expiresAt: 2 } };
  mockState.signedIn = true;
  mockState.isAvailable = true;
});

describe('useOsAssistantCredentials — handing the token over', () => {
  it('mints once and publishes it with the app locale', async () => {
    await mount();

    expect(mockState.mints).toBe(1);
    expect(mockState.published).toEqual([{ token: 'tok-1', locale: 'tr' }]);
  });

  it('does nothing at all when there is no OS assistant to hand it to', async () => {
    mockState.isAvailable = false;

    await mount();

    expect(mockState.mints).toBe(0);
    expect(mockState.published).toEqual([]);
  });
});

describe('useOsAssistantCredentials — taking it away', () => {
  // The credential outlives the session in the shared container. Left behind,
  // the next person to hold the phone asks Siri a question that is answered
  // with the previous user's account.
  it('withdraws the token when the user is signed out, and mints nothing', async () => {
    mockState.signedIn = false;

    await mount();

    expect(mockState.mints).toBe(0);
    expect(mockState.published).toEqual([{ token: null, locale: 'tr' }]);
  });

  // Offline at launch is the common case. Replacing a working credential with
  // nothing would turn a temporary network problem into a feature that stays
  // broken until some later launch happens to succeed.
  it('leaves the stored token alone when the mint fails', async () => {
    mockState.mintResult = { ok: false };

    await mount();

    expect(mockState.mints).toBe(1);
    expect(mockState.published).toEqual([]);
  });
});
