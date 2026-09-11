import { ok } from '../../result/result';
import type { AssistantFailure } from '../../result/failure';
import type { Result } from '../../result/result';
import type { AssistantPlayer } from '../../audio/assistant-player';

export class FakePlayer implements AssistantPlayer {
  readonly enqueued: Float32Array[] = [];
  flushes = 0;
  remaining = 0;
  prepareResult: Result<void, AssistantFailure> = ok(undefined);
  readonly calls: string[];

  constructor(calls: string[]) {
    this.calls = calls;
  }
  level(): number {
    return 0.8;
  }
  remainingSeconds(): number {
    return this.remaining;
  }
  async prepare(): Promise<Result<void, AssistantFailure>> {
    this.calls.push('player.prepare');
    return this.prepareResult;
  }
  enqueue(samples: Float32Array<ArrayBuffer>): void {
    this.enqueued.push(samples);
  }
  flush(): void {
    this.flushes += 1;
  }
  async stop(): Promise<void> {
    this.calls.push('player.stop');
  }
}
