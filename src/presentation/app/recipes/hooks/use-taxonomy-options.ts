import { useMemo } from 'react';
import { useStores } from '@presentation/bootstrap/use-stores';
import { CUISINE_KEY_VALUES } from '@domain/recipes/taxonomy/cuisine-key';
import { RECIPE_CATEGORY_VALUES } from '@domain/recipes/taxonomy/recipe-category';
import type { TaxonomyOptions } from '@presentation/app/recipes/model/taxonomy-options';
import { ValueConstants } from '@core/constants';
import { TaxonomyStatus } from '@application/recipes/taxonomy/taxonomy-status';

/**
 * Resolves which cuisine/category keys to *offer* as options: the full backend
 * catalog (44 / 31) once the taxonomy store is `ready`, otherwise the bundled
 * local enum values (15 / 11) so the filters are never empty before the store
 * loads, while offline, or on error. Display names/emojis are resolved
 * separately via {@link useTaxonomyLabel}.
 */
export const useTaxonomyOptions = (): TaxonomyOptions => {
  const { taxonomyStore } = useStores();
  const status = taxonomyStore((s) => s.status);
  const cuisines = taxonomyStore((s) => s.cuisines);
  const categories = taxonomyStore((s) => s.categories);

  return useMemo(() => {
    const ready = status === TaxonomyStatus.Ready;
    return {
      cuisineKeys:
        ready && cuisines.length > ValueConstants.zero ? cuisines.map((c) => c.key) : CUISINE_KEY_VALUES,
      categoryKeys:
        ready && categories.length > ValueConstants.zero ? categories.map((c) => c.key) : RECIPE_CATEGORY_VALUES,
    };
  }, [status, cuisines, categories]);
};
