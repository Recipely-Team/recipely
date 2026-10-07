import { AssistantBudget } from '@domain/assistant/session/assistant-budget';

const budget = (remainingSeconds: number, isUnlimited = false): AssistantBudget => {
  const created = AssistantBudget.create({ remainingSeconds, isUnlimited });
  if (!created.ok) throw new Error('expected a budget');
  return created.value;
};

describe('AssistantBudget', () => {
  it('is exhausted at zero and below on a metered account', () => {
    expect(budget(0).isExhausted()).toBe(true);
    expect(budget(-5).isExhausted()).toBe(true);
    expect(budget(1).isExhausted()).toBe(false);
  });

  it('never runs out or warns on an unlimited account, whatever its number says', () => {
    expect(budget(0, true).isExhausted()).toBe(false);
    expect(budget(10, true).needsWarning(75)).toBe(false);
    expect(budget(0, true).isUnlimited).toBe(true);
  });

  it('warns at or below the threshold, but not once the budget is gone', () => {
    expect(budget(75).needsWarning(75)).toBe(true);
    expect(budget(76).needsWarning(75)).toBe(false);
    expect(budget(0).needsWarning(75)).toBe(false);
  });

  it('refuses a budget that is not a number', () => {
    expect(AssistantBudget.create({ remainingSeconds: Number.NaN, isUnlimited: false }).ok).toBe(false);
  });

  it('compares by seconds and by whether it is metered', () => {
    expect(budget(30).equals(budget(30))).toBe(true);
    expect(budget(30).equals(budget(30, true))).toBe(false);
    expect(budget(30).remainingSeconds).toBe(30);
  });
});
