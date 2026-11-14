import { configureAiLimitStore } from '@application/subscriptions/ai-limit-store';

const limit = (used: number) => ({ scope: 'daily' as const, limit: 200, used, resetsAt: new Date('2026-11-15T00:00:00.000Z') });

describe('aiLimitStore', () => {
  it('shows the first refusal and never stacks a second one over it', () => {
    const store = configureAiLimitStore();
    store.getState().report(limit(200));
    store.getState().report(limit(201));
    expect(store.getState().limit?.used).toBe(200);
    store.getState().dismiss();
    expect(store.getState().limit).toBeNull();
  });
});
