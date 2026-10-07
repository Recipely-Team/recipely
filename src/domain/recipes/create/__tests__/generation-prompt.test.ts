import { GenerationPrompt } from '@domain/recipes/create/generation-prompt';
import { ErrorMessageKey } from '@core/failure';

describe('GenerationPrompt', () => {
  it('trims the prompt', () => {
    const result = GenerationPrompt.create('  pasta for two \n');
    expect(result.ok && result.value.value).toBe('pasta for two');
  });

  it.each(['', '   ', '\n\t'])('refuses a blank prompt (%j) with the backend key', (raw) => {
    const result = GenerationPrompt.create(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.messageKey).toBe(ErrorMessageKey.promptRequired);
  });
});
