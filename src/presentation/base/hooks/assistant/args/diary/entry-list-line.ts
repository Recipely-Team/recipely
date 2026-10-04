import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';

/** "Menemen (breakfast, 1 serving, 300 kcal); …" — what the model is shown to ask "which one?". */
export const entryListLine = (entries: readonly FoodLogEntryEntity[]): string =>
  entries
    .map((entry) => `${entry.name} (${entry.meal}, ${entry.servings} serving(s), ${Math.round(entry.nutrients.calories)} kcal)`)
    .join(SCREEN_PART_SEPARATOR);
