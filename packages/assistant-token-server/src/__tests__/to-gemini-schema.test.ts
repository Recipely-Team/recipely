import { toGeminiSchema } from '../to-gemini-schema';

describe('toGeminiSchema', () => {
  // The upper-case enum names are the form measured against the Live API.
  it('spells every type in upper case, at every depth, and leaves the rest alone', () => {
    expect(
      toGeminiSchema({
        type: 'object',
        properties: {
          steps: { type: 'array', items: { type: 'string', enum: ['up', 'down'] } },
          type: { type: 'string', description: 'a field literally named type' },
        },
        required: ['steps'],
      }),
    ).toEqual({
      type: 'OBJECT',
      properties: {
        steps: { type: 'ARRAY', items: { type: 'STRING', enum: ['up', 'down'] } },
        type: { type: 'STRING', description: 'a field literally named type' },
      },
      required: ['steps'],
    });
  });

  it('turns a nullable type union into Gemini’s nullable flag', () => {
    expect(toGeminiSchema({ type: ['string', 'null'], description: 'optional note' })).toEqual({
      type: 'STRING',
      nullable: true,
      description: 'optional note',
    });
  });

  it('leaves data alone, even when it contains a key named type', () => {
    const schema = { type: 'object', default: { type: 'draft' }, examples: [{ type: 'final' }], enum: ['a'] };

    expect(toGeminiSchema(schema)).toEqual({ ...schema, type: 'OBJECT' });
  });
});
