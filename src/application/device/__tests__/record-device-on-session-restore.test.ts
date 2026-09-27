import type { RecordDeviceUseCase } from '@application/device/record-device-use-case';
import { recordDeviceOnSessionRestore } from '@application/device/record-device-on-session-restore';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';

const makeRecordDevice = (execute: jest.Mock): RecordDeviceUseCase =>
  ({ execute }) as unknown as RecordDeviceUseCase;

describe('recordDeviceOnSessionRestore — the device heartbeat', () => {
  it('sends one heartbeat per call', () => {
    const execute = jest.fn(() => Promise.resolve(ok(undefined)));

    recordDeviceOnSessionRestore(makeRecordDevice(execute))();

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('swallows a failed heartbeat — neither the Result nor a rejection reaches the user', async () => {
    const rejected = jest.fn(() => Promise.reject(new Error('boom')));
    const failed = jest.fn(() => Promise.resolve(fail(new NetworkFailure('offline'))));

    expect(() => recordDeviceOnSessionRestore(makeRecordDevice(rejected))()).not.toThrow();
    expect(() => recordDeviceOnSessionRestore(makeRecordDevice(failed))()).not.toThrow();
    await Promise.resolve();

    expect(rejected).toHaveBeenCalledTimes(1);
    expect(failed).toHaveBeenCalledTimes(1);
  });
});
