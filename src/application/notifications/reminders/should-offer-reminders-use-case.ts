import type { PreferenceStoreInterface } from '@domain/storage/preference-store-interface';
import { PreferenceSlot } from '@domain/storage/preference-slot';
import { shouldOfferReminders } from '@domain/notifications/reminders/should-offer-reminders';
import { readRemindersChoice } from '@application/notifications/reminders/read-reminders-choice';

/**
 * **Whether to ask "may we remind you?" now**, recording the first open on the way.
 *
 * @remarks
 * - **First open:** the first call stores `nowMs` and answers no; the question waits for a return visit
 *   ({@link shouldOfferReminders}).
 */
export class ShouldOfferRemindersUseCase {
  constructor(private readonly prefs: PreferenceStoreInterface) {}

  async execute(nowMs: number): Promise<boolean> {
    const choice = await readRemindersChoice(this.prefs);
    const stored = await this.prefs.get(PreferenceSlot.FirstOpenAt);
    const firstOpenMs = stored.ok && stored.value !== null ? Number(stored.value) : null;
    if (firstOpenMs === null || Number.isNaN(firstOpenMs)) {
      await this.prefs.set(PreferenceSlot.FirstOpenAt, String(nowMs));
      return false;
    }
    return shouldOfferReminders(choice, firstOpenMs, nowMs);
  }
}
