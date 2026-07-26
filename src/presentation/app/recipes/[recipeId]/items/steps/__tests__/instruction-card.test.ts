/**
 * `splitStepWithTimers` regression coverage — a "45-50 minutes" range must not
 * be badge-ified (previously the parser matched only the trailing number,
 * splitting "45-50 minutes," into "45-" + a "50 min" badge + "until just
 * set."). A single duration must still badge correctly.
 */

import { splitStepWithTimers } from '@presentation/app/recipes/[recipeId]/model/ingredients/split-step-with-timers';

describe('splitStepWithTimers — duration range', () => {
  it('keeps a "45-50 minutes" range as plain text instead of badge-ifying the trailing number', () => {
    const parts = splitStepWithTimers('Bake at 170°C for 45-50 minutes, until just set.');

    expect(parts).toEqual([
      { kind: 'text', value: 'Bake at 170°C for ' },
      { kind: 'text', value: '45-50 minutes' },
      { kind: 'text', value: ', until just set.' },
    ]);
    expect(parts.some((p) => p.kind === 'timer')).toBe(false);
  });

  it('keeps a hyphen-spaced range ("45 - 50 min") as plain text too', () => {
    const parts = splitStepWithTimers('Simmer for 45 - 50 min.');

    expect(parts.some((p) => p.kind === 'timer')).toBe(false);
    expect(parts.map((p) => p.value).join('')).toBe('Simmer for 45 - 50 min.');
  });
});

describe('splitStepWithTimers — single duration', () => {
  it('still badges a normal single-duration instruction', () => {
    const parts = splitStepWithTimers('Cook for 20 minutes.');

    expect(parts).toEqual([
      { kind: 'text', value: 'Cook for ' },
      { kind: 'timer', value: '20 minutes', minutes: 20 },
      { kind: 'text', value: '.' },
    ]);
  });

  it('badges a Turkish single duration ("dakika")', () => {
    const parts = splitStepWithTimers('20 dakika pişirin.');

    expect(parts).toEqual([
      { kind: 'timer', value: '20 dakika', minutes: 20 },
      { kind: 'text', value: ' pişirin.' },
    ]);
  });

  it('returns the original text unchanged when there is no duration at all', () => {
    const parts = splitStepWithTimers('Season with salt and pepper.');

    expect(parts).toEqual([{ kind: 'text', value: 'Season with salt and pepper.' }]);
  });
});
