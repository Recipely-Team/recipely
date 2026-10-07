import { ClaimWriteQueue } from '@application/auth/claim-write-queue';

/** A call held open until the test settles it. */
const deferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve: (value: T) => resolve(value) };
};

describe('ClaimWriteQueue', () => {
  it('starts a write only once the one before it has settled', async () => {
    const queue = new ClaimWriteQueue();
    const first = deferred<string>();
    const started: string[] = [];

    const a = queue.write(() => {
      started.push('a');
      return first.promise;
    });
    const b = queue.write(() => {
      started.push('b');
      return Promise.resolve('b');
    });
    await Promise.resolve();
    expect(started).toEqual(['a']);

    first.resolve('a');
    await expect(a).resolves.toBe('a');
    await expect(b).resolves.toBe('b');
    expect(started).toEqual(['a', 'b']);
  });

  it('keeps going after a write that rejects', async () => {
    const queue = new ClaimWriteQueue();

    const failed = queue.write(() => Promise.reject(new Error('boom')));
    const next = queue.write(() => Promise.resolve('next'));

    await expect(failed).rejects.toThrow('boom');
    await expect(next).resolves.toBe('next');
  });

  it('a refresh with no write around it is current', async () => {
    const queue = new ClaimWriteQueue();

    await expect(queue.refresh((isCurrent) => Promise.resolve(isCurrent()))).resolves.toBe(true);
  });

  it('a refresh started while a write is in flight is not current', async () => {
    const queue = new ClaimWriteQueue();
    const write = deferred<void>();
    void queue.write(() => write.promise);

    const current = await queue.refresh((isCurrent) => Promise.resolve(isCurrent()));

    expect(current).toBe(false);
    write.resolve(undefined);
  });

  it('a refresh overtaken by a write queued while it ran is not current', async () => {
    const queue = new ClaimWriteQueue();
    const answer = deferred<void>();

    const refreshed = queue.refresh(async (isCurrent) => {
      await answer.promise;
      return isCurrent();
    });
    await queue.write(() => Promise.resolve());
    answer.resolve(undefined);

    await expect(refreshed).resolves.toBe(false);
  });

  it('a refresh after every write settled is current again', async () => {
    const queue = new ClaimWriteQueue();
    await queue.write(() => Promise.resolve());

    await expect(queue.refresh((isCurrent) => Promise.resolve(isCurrent()))).resolves.toBe(true);
  });
});
