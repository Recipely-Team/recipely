import { useTheme } from '@presentation/base/theme/context/use-theme';
import { DIARY_TONES } from '@presentation/base/theme/colors/tones/diary-tones';

/** The food diary's status tones for the active colour scheme. */
export const useDiaryTones = (): (typeof DIARY_TONES)[keyof typeof DIARY_TONES] => DIARY_TONES[useTheme().scheme];
