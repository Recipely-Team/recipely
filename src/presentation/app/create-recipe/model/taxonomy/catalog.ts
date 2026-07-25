import type { TaxonomyItem } from '@domain/recipes/taxonomy/taxonomy-item';

export interface Catalog {
  items: readonly TaxonomyItem[];
  title: string;
}
