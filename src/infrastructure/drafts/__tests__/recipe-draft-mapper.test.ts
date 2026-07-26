import { toRecipeDraft } from '@infrastructure/drafts/recipe-draft-mapper';
import type { RecipeDraftDto } from '@infrastructure/drafts/dtos/recipe-draft-dto';

const fullDto: RecipeDraftDto = {
  id: 'd1e2f3a4-5678-4901-bcde-f01234567890',
  ownerId: 'owner-9',
  prompt: 'spicy ramen for two',
  snapshot: {
    name: 'Spicy Ramen',
    cuisine: 'japanese',
    difficulty: 'medium',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 2,
    ingredients: ['Noodles', 'Chili oil'],
    instructions: ['Boil', 'Assemble'],
    media: [{ type: 'image', url: 'https://cdn.recipely.io/drafts/1.webp' }],
  },
  chatHistory: [
    { role: 'user', content: 'make it spicier' },
    { role: 'assistant', content: 'Added chili oil.' },
  ],
  createdAt: '2026-05-11T12:00:00.000Z',
  updatedAt: '2026-05-12T08:30:00.000Z',
};

describe('toRecipeDraft', () => {
  it('maps the scalar fields verbatim', () => {
    const draft = toRecipeDraft(fullDto);

    expect(draft.id).toBe('d1e2f3a4-5678-4901-bcde-f01234567890');
    expect(draft.ownerId).toBe('owner-9');
    expect(draft.prompt).toBe('spicy ramen for two');
  });

  it('parses ISO createdAt / updatedAt strings into Date instances', () => {
    const draft = toRecipeDraft(fullDto);

    expect(draft.createdAt).toBeInstanceOf(Date);
    expect(draft.updatedAt).toBeInstanceOf(Date);
    expect(draft.createdAt.toISOString()).toBe('2026-05-11T12:00:00.000Z');
    expect(draft.updatedAt.toISOString()).toBe('2026-05-12T08:30:00.000Z');
  });

  it('passes snapshot and chatHistory through unchanged', () => {
    const draft = toRecipeDraft(fullDto);

    expect(draft.snapshot).toEqual(fullDto.snapshot);
    expect(draft.chatHistory).toEqual(fullDto.chatHistory);
  });

  it('preserves an assistant error turn in chatHistory', () => {
    const dto: RecipeDraftDto = {
      ...fullDto,
      chatHistory: [{ role: 'assistant', content: 'refine failed', error: true }],
    };

    const draft = toRecipeDraft(dto);

    expect(draft.chatHistory[0]).toEqual({
      role: 'assistant',
      content: 'refine failed',
      error: true,
    });
  });
});
