import type { TaxonomyLabel } from '@presentation/base/taxonomy/taxonomy-label';

export interface UseTaxonomyLabelResult {
  cuisineLabel: (key: string) => TaxonomyLabel;
  categoryLabel: (key: string) => TaxonomyLabel;
}
