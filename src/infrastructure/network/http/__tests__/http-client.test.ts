import { HttpClient } from '@infrastructure/network/http/http-client';
import type { HttpClientOptions } from '@infrastructure/network/http/http-client-options';

// Mock axios so `create()` returns a fake instance whose `request` resolves
// with a status we control. The real interceptors are registered on this fake
// instance (harmless no-op stubs) but never run, since we feed the response
// directly — that is enough to exercise the 401 hook in `request<T>()`.
// `create` is exposed BOTH as a named export and on the default, mirroring the
// real module: axios ships it both ways, and HttpClient imports the named one.
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
  overrides: Partial<HttpClientOptions> = {},
): { client: HttpClient; onUnauthorized: jest.Mock } => {
  const onUnauthorized = jest.fn();
  const client = new HttpClient({
    baseUrl: 'https://api.test',
    tokenProvider: () => Promise.resolve('tok'),
    localeProvider: () => Promise.resolve('en'),
    onUnauthorized,
    ...overrides,
  });
  return { client, onUnauthorized };
};

describe('HttpClient onUnauthorized hook', () => {
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
