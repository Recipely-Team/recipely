import type { TaxonomyItem } from '@domain/recipes/taxonomy/taxonomy-item';
import type { TaxonomyItemDto } from '@infrastructure/recipes/taxonomy/dtos/taxonomy-item-dto';
import { CharConstants, ValueConstants } from '@core/constants';

/**
 * Maps one raw taxonomy DTO to a domain `TaxonomyItem`, or `null` when the
 * entry is malformed. WHY: the catalog is large (44 cuisines / 31 categories)
 * and backend-driven — a single bad row should be skipped, not abort the whole
 * list. A non-empty `key` is the only hard requirement (it is the persisted
 * value); `name`/`emoji` fall back to safe empties so the UI can still render.
 */
export function toTaxonomyItem(dto: TaxonomyItemDto | null | undefined): TaxonomyItem | null {
  if (dto === null || dto === undefined) {
    return null;
  }
  if (typeof dto.key !== 'string' || dto.key.length === ValueConstants.zero) {
    return null;
  }
  return {
    key: dto.key,
    name: typeof dto.name === 'string' ? dto.name : CharConstants.empty,
    emoji: typeof dto.emoji === 'string' ? dto.emoji : CharConstants.empty,
  };
}

/** Maps a raw taxonomy list, dropping any malformed entries. */
export function toTaxonomyItems(
  dtos: readonly (TaxonomyItemDto | null | undefined)[] | null | undefined,
): TaxonomyItem[] {
  if (!Array.isArray(dtos)) {
    return [];
  }
  const items: TaxonomyItem[] = [];
  for (const dto of dtos) {
    const item = toTaxonomyItem(dto);
    if (item !== null) {
      items.push(item);
    }
  }
  return items;
}
