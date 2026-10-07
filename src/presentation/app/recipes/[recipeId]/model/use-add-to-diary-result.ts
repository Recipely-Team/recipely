import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { AddFoodRequestType } from '@presentation/base/widgets/diary/add-food/request/add-food-request';

/** Recipe Detail's "Add to diary", as `useAddToDiary` exposes it. */
export interface UseAddToDiaryResult {
  /** The recipe as one loggable serving; null when it has no calories, which hides the button. */
  food: LoggableFood | null;
  request: AddFoodRequestType | null;
  /** Opens the Add food sheet on its detail step — or, for a guest, the sign-in prompt. */
  open: () => void;
  close: () => void;
  openDiary: () => void;
  promptVisible: boolean;
  promptMessage: string | undefined;
  closePrompt: () => void;
  goToSignIn: () => void;
}
