import { ensurePushRegistration, setPushRegistrationHandler } from '@application/notifications/ensure-push-registration';

describe('ensurePushRegistration', () => {
  it('is a no-op until a handler is set, then runs the latest one', () => {
    expect(() => ensurePushRegistration()).not.toThrow();
    const first = jest.fn();
    const second = jest.fn();
    setPushRegistrationHandler(first);
    setPushRegistrationHandler(second);
    ensurePushRegistration();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
