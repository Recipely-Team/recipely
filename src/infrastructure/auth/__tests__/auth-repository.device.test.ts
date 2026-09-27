import { DevicePlatform } from '@domain/notifications/device-platform';
import { NetworkFailure, UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { AuthRepository } from '@infrastructure/auth/auth-repository';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { FixedDeviceIdentity } from '@infrastructure/device/__fixtures__/fixed-device-identity';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';

jest.mock('@infrastructure/auth/social/social-auth-provider', () => ({
  acquireGoogleFirebaseToken: jest.fn(() => Promise.resolve({ ok: true, value: 'firebase-id-token' })),
  acquireAppleFirebaseToken: jest.fn(() => Promise.resolve({ ok: true, value: 'firebase-id-token' })),
}));

interface RequestCall {
  url?: string;
  data?: unknown;
}

const makeHttp = (): { http: HttpClient; calls: RequestCall[] } => {
  const calls: RequestCall[] = [];
  const http = withHttpVerbs(jest.fn((config: RequestCall) => {
    calls.push({ url: config.url, data: config.data });
    return Promise.resolve(fail(new NetworkFailure('offline')));
  }));
  return { http, calls };
};

const storage = {} as SecureTokenStorage;

const expectedDevice = { deviceId: 'install-1', platform: DevicePlatform.Ios, appVersion: '1.0.50' };

// The devices table stayed empty because no session-opening request named the
// device it came from. Each of the three must carry `device`.
describe('AuthRepository — session-opening requests carry the device', () => {
  it('login sends the device', async () => {
    const { http, calls } = makeHttp();
    await new AuthRepository(http, storage, new FixedDeviceIdentity()).signIn('u@example.com', 'secret123');

    expect(calls[0]?.url).toBe(ApiRoutes.auth.login);
    expect(calls[0]?.data).toMatchObject({ email: 'u@example.com', device: expectedDevice });
  });

  it('registration verify sends the device', async () => {
    const { http, calls } = makeHttp();
    await new AuthRepository(http, storage, new FixedDeviceIdentity()).verifyRegistration('u@example.com', '123456');

    expect(calls[0]?.url).toBe(ApiRoutes.auth.registerVerify);
    expect(calls[0]?.data).toMatchObject({ code: '123456', device: expectedDevice });
  });

  it('social auth sends the device', async () => {
    const { http, calls } = makeHttp();
    await new AuthRepository(http, storage, new FixedDeviceIdentity()).signInWithGoogle();

    expect(calls[0]?.url).toBe(ApiRoutes.auth.social);
    expect(calls[0]?.data).toMatchObject({ idToken: 'firebase-id-token', device: expectedDevice });
  });

  it('leaves appVersion off when the build publishes none', async () => {
    const { http, calls } = makeHttp();
    const identity = new FixedDeviceIdentity(ok({ ...FixedDeviceIdentity.defaultIdentity, appVersion: null }));
    await new AuthRepository(http, storage, identity).signIn('u@example.com', 'secret123');

    expect(calls[0]?.data).toMatchObject({ device: { deviceId: 'install-1', platform: DevicePlatform.Ios } });
    expect((calls[0]?.data as { device: object }).device).not.toHaveProperty('appVersion');
  });

  it('still signs in, without a device, when the identity cannot be read', async () => {
    const { http, calls } = makeHttp();
    const identity = new FixedDeviceIdentity(fail(new UnknownFailure('keychain locked')));
    await new AuthRepository(http, storage, identity).signIn('u@example.com', 'secret123');

    expect(calls).toHaveLength(1);
    expect(calls[0]?.data).not.toHaveProperty('device');
  });
});
