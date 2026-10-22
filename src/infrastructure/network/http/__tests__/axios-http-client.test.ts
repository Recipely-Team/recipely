import { AxiosHttpClient } from '@infrastructure/network/http/axios-http-client';
import type { AxiosHttpClientOptions } from '@infrastructure/network/http/axios-http-client-options';

// Mock axios so `create()` returns a fake instance whose `request` resolves
// with a status we control. The real interceptors are registered on this fake
// instance (harmless no-op stubs) but never run, since we feed the response
// directly — that is enough to exercise the 401 hook in `request<T>()`.
// `create` is exposed BOTH as a named export and on the default, mirroring the
// real module: axios ships it both ways, and AxiosHttpClient imports the named one.
const mockRequest = jest.fn();

// The crypto envelope module pulls in `@noble/ciphers` (ESM, outside the jest
// transform allowlist). We feed plaintext responses directly, so stub it out —
// none of these tests exercise encryption/decryption.
jest.mock('@infrastructure/crypto/aes-envelope', () => ({
  __esModule: true,
  encryptEnvelope: jest.fn((body: unknown) => body),
  decryptEnvelope: jest.fn((body: unknown) => body),
  keyFromHex: jest.fn(() => new Uint8Array(32)),
  EnvelopeDecryptError: class extends Error {},
}));

jest.mock('axios', () => {
  const useStub = jest.fn();
  const fakeInstance = {
    request: (config: unknown) => mockRequest(config),
    interceptors: {
      request: { use: useStub },
      response: { use: useStub },
    },
  };
  class FakeAxiosError extends Error {}
  const create = jest.fn(() => fakeInstance);
  return {
    __esModule: true,
    create,
    default: { create },
    AxiosError: FakeAxiosError,
    AxiosHeaders: class {},
  };
});

const buildClient = (
  overrides: Partial<AxiosHttpClientOptions> = {},
): { client: AxiosHttpClient; onUnauthorized: jest.Mock } => {
  const onUnauthorized = jest.fn();
  const client = new AxiosHttpClient({
    baseUrl: 'https://api.test',
    tokenProvider: () => Promise.resolve('tok'),
    localeProvider: () => Promise.resolve('en'),
    onUnauthorized,
    ...overrides,
  });
  return { client, onUnauthorized };
};

describe('AxiosHttpClient onUnauthorized hook', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it('invokes onUnauthorized exactly once on a 401 response', async () => {
    mockRequest.mockResolvedValue({
      status: 401,
      data: { error: { code: 'unauthorized', message: 'expired' } },
    });
    const { client, onUnauthorized } = buildClient();

    const result = await client.request({ url: '/me' });

    expect(result.ok).toBe(false);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does NOT invoke onUnauthorized on a 200 response', async () => {
    mockRequest.mockResolvedValue({ status: 200, data: { data: { id: 'x' } } });
    const { client, onUnauthorized } = buildClient();

    const result = await client.request({ url: '/me' });

    expect(result.ok).toBe(true);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('does NOT invoke onUnauthorized on a 500 response', async () => {
    mockRequest.mockResolvedValue({
      status: 500,
      data: { error: { code: 'server', message: 'boom' } },
    });
    const { client, onUnauthorized } = buildClient();

    const result = await client.request({ url: '/me' });

    expect(result.ok).toBe(false);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

/**
 * The symptom: "This took a while" on the web while the API was briefly
 * unavailable — a single slow or refused read went straight to the user.
 * A GET that times out or meets a 502/503/504 is asked once more.
 */
describe('AxiosHttpClient read retry', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => jest.useRealTimers());

  const settle = async <T>(pending: Promise<T>): Promise<T> => {
    await jest.runAllTimersAsync();
    return pending;
  };

  it('asks again after a 503 and returns the second answer', async () => {
    mockRequest.mockResolvedValueOnce({ status: 503, data: {} }).mockResolvedValueOnce({ status: 200, data: { data: { ok: 1 } } });
    const { client } = buildClient();

    const result = await settle(client.get<{ ok: number }>('/recipes'));

    expect(mockRequest).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true, value: { ok: 1 } });
  });

  it('does not ask again when the API itself refused the read', async () => {
    mockRequest.mockResolvedValue({ status: 404, data: {} });
    const { client } = buildClient();

    await settle(client.get('/recipes/missing'));

    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it('never repeats a write', async () => {
    mockRequest.mockResolvedValue({ status: 503, data: {} });
    const { client } = buildClient();

    await settle(client.post('/recipes', {}));

    expect(mockRequest).toHaveBeenCalledTimes(1);
  });
});

// Regression: an expired access token used to end the session on the first
// 401 — every user was signed out when their JWT lapsed, though a refresh
// token could have renewed it.
describe('AxiosHttpClient session refresh', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  const unauthorized = { status: 401, data: { error: { code: 'unauthorized', message: 'expired' } } };

  it('an expired access token is renewed and the request sent again, without signing out', async () => {
    mockRequest.mockResolvedValueOnce(unauthorized).mockResolvedValueOnce({ status: 200, data: { data: { id: 'r1' } } });
    const refreshSession = jest.fn(() => Promise.resolve(true));
    const { client, onUnauthorized } = buildClient({ refreshSession });

    const result = await client.get('/me/favorites');

    expect(result).toEqual({ ok: true, value: { id: 'r1' } });
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(mockRequest).toHaveBeenCalledTimes(2);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('signs out when the renewal is refused', async () => {
    mockRequest.mockResolvedValue(unauthorized);
    const { client, onUnauthorized } = buildClient({ refreshSession: () => Promise.resolve(false) });

    const result = await client.get('/me/favorites');

    expect(result.ok).toBe(false);
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('a wrong password does not try to refresh', async () => {
    mockRequest.mockResolvedValue(unauthorized);
    const refreshSession = jest.fn(() => Promise.resolve(true));
    const { client } = buildClient({ refreshSession });

    await client.post('/auth/login', { email: 'a@b.c', password: 'x' });
    await client.post('/auth/refresh', {});

    expect(refreshSession).not.toHaveBeenCalled();
  });
});

describe('AxiosHttpClient failure breadcrumbs', () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it('notes a failed request with the id it was sent under', async () => {
    mockRequest.mockResolvedValue({
      status: 404,
      data: { error: { code: 'not_found', message: 'gone' } },
      config: { headers: { 'X-Request-Id': 'rid-7' } },
    });
    const onRequestFailed = jest.fn();
    const { client } = buildClient({ onRequestFailed });

    await client.post('/recipes/r1/favorite');

    expect(onRequestFailed).toHaveBeenCalledWith(expect.stringMatching(/^POST \/recipes\/r1\/favorite → .+ \(request rid-7\)$/));
  });
});
