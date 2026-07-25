import { buildRefineReply } from '@presentation/app/create-recipe/model/generation/build-refine-reply';

const FALLBACK = 'Updated!';

describe('buildRefineReply', () => {
  it('returns the summary alone when there is no suggestion', () => {
    const reply = buildRefineReply({ summary: 'Doubled the garlic.' }, FALLBACK);

    expect(reply).toBe('Doubled the garlic.');
  });

  it('joins summary and suggestion with a blank line', () => {
    const reply = buildRefineReply(
      { summary: 'Doubled the garlic.', suggestion: 'Roast it first for a milder taste.' },
      FALLBACK,
    );

    expect(reply).toBe('Doubled the garlic.\n\nRoast it first for a milder taste.');
  });

  it('leads with the fallback when only a suggestion arrived', () => {
    const reply = buildRefineReply({ suggestion: 'Roast it first.' }, FALLBACK);

    expect(reply).toBe('Updated!\n\nRoast it first.');
  });

  it('returns the fallback alone when neither field arrived (older backend)', () => {
    const reply = buildRefineReply({}, FALLBACK);

    expect(reply).toBe('Updated!');
  });

  it('treats whitespace-only summary and suggestion as absent', () => {
    const reply = buildRefineReply({ summary: '   \n\t ', suggestion: '  ' }, FALLBACK);

    expect(reply).toBe('Updated!');
  });

  it('trims the surviving summary and suggestion before joining', () => {
    const reply = buildRefineReply(
      { summary: '  Doubled the garlic. ', suggestion: ' Roast it first. ' },
      FALLBACK,
    );

    expect(reply).toBe('Doubled the garlic.\n\nRoast it first.');
  });
});
