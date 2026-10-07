import { RefineInstruction } from '@domain/recipes/refine/refine-instruction';
import { ErrorMessageKey } from '@core/failure';

describe('RefineInstruction', () => {
  it('trims the instruction', () => {
    const result = RefineInstruction.create('  less salt ');
    expect(result.ok && result.value.value).toBe('less salt');
  });

  it("refuses a blank instruction with its own key, not the prompt's", () => {
    const result = RefineInstruction.create('   ');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.messageKey).toBe(ErrorMessageKey.refineInstructionRequired);
  });
});
