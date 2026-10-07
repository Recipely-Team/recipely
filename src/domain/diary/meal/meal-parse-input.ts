import type { MealParseInputKind } from '@domain/diary/meal/meal-parse-input-kind';

/**
 * One meal to parse: a description, or a local photo file. `locale` is a
 * language tag the parser answers labels in; null lets the server choose.
 */
export type MealParseInputType =
  | { readonly kind: typeof MealParseInputKind.Text; readonly text: string; readonly locale: string | null }
  | {
      readonly kind: typeof MealParseInputKind.Photo;
      readonly uri: string;
      readonly fileName: string;
      readonly mimeType: string;
      readonly locale: string | null;
    };
