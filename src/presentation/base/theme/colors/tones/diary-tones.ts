import type { CalorieStatusType } from '@domain/diary/nutrition/calorie-status';
import type { ThemeVariant } from '@presentation/base/theme/context/theme-variant';
import type { DiaryTone } from '@presentation/base/theme/colors/tones/diary-tone';

/**
 * The food diary's status tones, per colour scheme (design spec → Food Diary §2.1).
 *
 * @remarks
 * - **Fixed hues, not per palette.** "Over" is orange and "far over" red in
 *   every theme, so a Crimson primary can never be mistaken for a warning.
 * - **`none` has no tone** — an unlogged day is drawn with the card's own
 *   border, so it is absent here and the caller decides that case.
 * - Contrast is asserted for all eight palette/scheme combinations in
 *   `__tests__/diary-tones.test.ts`.
 */
export const DIARY_TONES: Readonly<
  Record<ThemeVariant, Readonly<Record<Exclude<CalorieStatusType, 'none'>, DiaryTone>>>
> = {
  light: {
    under: { bg: '#DCE7F5', fg: '#1E3A5F', solid: '#2F62A8' },
    on: { bg: '#CFEFD9', fg: '#14532D', solid: '#15803D' },
    over: { bg: '#FDE2C4', fg: '#7C2D12', solid: '#C2410C' },
    far: { bg: '#F8CFCB', fg: '#7F1D1D', solid: '#B91C1C' },
  },
  dark: {
    under: { bg: '#1E3350', fg: '#D6E6FB', solid: '#8AB8F2' },
    on: { bg: '#163A26', fg: '#BDEFCD', solid: '#6BD394' },
    over: { bg: '#4A2A10', fg: '#FFD7AE', solid: '#FB923C' },
    far: { bg: '#4F1818', fg: '#FFC8C2', solid: '#F87171' },
  },
};
