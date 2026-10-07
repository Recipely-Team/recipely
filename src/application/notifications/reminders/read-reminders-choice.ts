import type { PreferenceStoreInterface } from '@domain/storage/preference-store-interface';
import { PreferenceSlot } from '@domain/storage/preference-slot';
import { RemindersChoice, type RemindersChoiceType } from '@domain/notifications/reminders/reminders-choice';

/** The stored answer to "may we remind you?"; `null` when never asked, unreadable or unrecognised. */
export const readRemindersChoice = async (prefs: PreferenceStoreInterface): Promise<RemindersChoiceType | null> => {
  const read = await prefs.get(PreferenceSlot.RemindersChoice);
  if (!read.ok) return null;
  if (read.value === RemindersChoice.On || read.value === RemindersChoice.Off) return read.value;
  return null;
};
