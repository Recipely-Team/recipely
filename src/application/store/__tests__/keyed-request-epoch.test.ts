import { KeyedRequestEpoch } from '@application/store/keyed-request-epoch';

describe('KeyedRequestEpoch', () => {
  it('keeps the newest request per key without touching other keys', () => {
    const epoch = new KeyedRequestEpoch();
    const a1 = epoch.start('a');
    const b1 = epoch.start('b');
    const a2 = epoch.start('a');

    expect([a1(), a2(), b1()]).toEqual([false, true, true]);
  });

  it('invalidates one key or every key, and a cleared key never revives an old check', () => {
    const epoch = new KeyedRequestEpoch();
    const a1 = epoch.start('a');
    const b1 = epoch.start('b');
    epoch.invalidate('a');
    expect([a1(), b1()]).toEqual([false, true]);

    epoch.invalidate();
    const a2 = epoch.start('a');
    expect([b1(), a1(), a2()]).toEqual([false, false, true]);
  });
});
