import { ok } from '../../result/result';
import type { AssistantFailure } from '../../result/failure';
import type { Result } from '../../result/result';
import type { AssistantMicrophone } from '../../audio/assistant-microphone';

export class FakeMicrophone implements AssistantMicrophone {
  cancelsEcho = true;
  access: Result<void, AssistantFailure> = ok(undefined);
  startResult: Result<void, AssistantFailure> = ok(undefined);
  currentLevel = 0.5;
  running = false;
  private onFrame: ((samples: Float32Array<ArrayBuffer>) => void) | null = null;
  readonly calls: string[];

  constructor(calls: string[]) {
    this.calls = calls;
  }
  level(): number {
    return this.currentLevel;
  }
  async ensureAccess(): Promise<Result<void, AssistantFailure>> {
    this.calls.push('access');
    return this.access;
  }
  async start(_rate: number, onFrame: (samples: Float32Array<ArrayBuffer>) => void): Promise<Result<void, AssistantFailure>> {
    this.calls.push('mic.start');
    this.onFrame = onFrame;
    this.running = this.startResult.ok;
    return this.startResult;
  }
  async stop(): Promise<void> {
    this.calls.push('mic.stop');
    this.running = false;
  }
  frame(): void {
    this.onFrame?.(new Float32Array(160));
  }
}
