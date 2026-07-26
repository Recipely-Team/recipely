import type { TaxonomyItemDto } from '@infrastructure/recipes/taxonomy/dtos/taxonomy-item-dto';
import {
  toTaxonomyItem,
  toTaxonomyItems,
} from '@infrastructure/recipes/taxonomy/taxonomy-mapper';

const validDto: TaxonomyItemDto = {
  key: 'TURKISH',
  name: 'Turkish',
  emoji: '🇹🇷',
};

describe('toTaxonomyItem', () => {
  it('maps a well-formed DTO into a TaxonomyItem', () => {
    const item = toTaxonomyItem(validDto);

    expect(item).toEqual({ key: 'TURKISH', name: 'Turkish', emoji: '🇹🇷' });
  });

  it('returns null for null or undefined input', () => {
    expect(toTaxonomyItem(null)).toBeNull();
    expect(toTaxonomyItem(undefined)).toBeNull();
  });

  it('drops an entry whose key is not a string', () => {
    const malformed = { key: 42, name: 'Bad', emoji: '❌' } as unknown as TaxonomyItemDto;

    expect(toTaxonomyItem(malformed)).toBeNull();
  });

  it('drops an entry whose key is an empty string', () => {
    const item = toTaxonomyItem({ ...validDto, key: '' });

    expect(item).toBeNull();
  });

  it("defaults name to '' when it is missing or non-string", () => {
    const missingName = { key: 'BREAKFAST', emoji: '🍳' } as unknown as TaxonomyItemDto;
    const nonStringName = {
      key: 'BREAKFAST',
      name: 123,
      emoji: '🍳',
    } as unknown as TaxonomyItemDto;

    expect(toTaxonomyItem(missingName)).toEqual({
      key: 'BREAKFAST',
      name: '',
      emoji: '🍳',
    });
    expect(toTaxonomyItem(nonStringName)).toEqual({
      key: 'BREAKFAST',
      name: '',
      emoji: '🍳',
    });
  });

  it("defaults emoji to '' when it is missing or non-string", () => {
    const missingEmoji = { key: 'BREAKFAST', name: 'Breakfast' } as unknown as TaxonomyItemDto;
    const nonStringEmoji = {
      key: 'BREAKFAST',
      name: 'Breakfast',
      emoji: null,
    } as unknown as TaxonomyItemDto;

    expect(toTaxonomyItem(missingEmoji)).toEqual({
      key: 'BREAKFAST',
      name: 'Breakfast',
      emoji: '',
    });
    expect(toTaxonomyItem(nonStringEmoji)).toEqual({
      key: 'BREAKFAST',
      name: 'Breakfast',
      emoji: '',
    });
  });
});

describe('toTaxonomyItems', () => {
  it('maps a list of well-formed DTOs preserving order', () => {
    const items = toTaxonomyItems([
      { key: 'TURKISH', name: 'Turkish', emoji: '🇹🇷' },
      { key: 'ITALIAN', name: 'Italian', emoji: '🇮🇹' },
    ]);

    expect(items).toEqual([
      { key: 'TURKISH', name: 'Turkish', emoji: '🇹🇷' },
      { key: 'ITALIAN', name: 'Italian', emoji: '🇮🇹' },
    ]);
  });

  it('drops malformed entries but keeps the valid ones', () => {
    const items = toTaxonomyItems([
      validDto,
      null,
      undefined,
      { key: '', name: 'Empty', emoji: '❓' },
      { key: 7, name: 'Numeric', emoji: '❓' } as unknown as TaxonomyItemDto,
      { key: 'BREAKFAST', name: 'Breakfast', emoji: '🍳' },
    ]);

    expect(items).toEqual([
      { key: 'TURKISH', name: 'Turkish', emoji: '🇹🇷' },
      { key: 'BREAKFAST', name: 'Breakfast', emoji: '🍳' },
    ]);
  });

  it('returns an empty array when input is not an array', () => {
    expect(toTaxonomyItems(null)).toEqual([]);
    expect(toTaxonomyItems(undefined)).toEqual([]);
  });

  it('returns an empty array for an empty input list', () => {
    expect(toTaxonomyItems([])).toEqual([]);
  });
});
