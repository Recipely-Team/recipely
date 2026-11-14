/**
 * The OS requests the app is running right now, by id.
 *
 * @remarks
 * - **One request, one run.** A request reaches the app twice when it is
 *   announced while the app is open (the event) and also sits in the queue
 *   (the drain on foreground). Claiming the id before the run, and releasing it
 *   after the acknowledgement, lets whichever road arrives second find it taken.
 * - **Pure bookkeeping.** No timers and no I/O, so the rule is testable without
 *   a device.
 */
export class InFlightInvocations {
  private readonly ids = new Set<string>();

  /** Takes the id; false when it is already running. */
  claim(invocationId: string): boolean {
    if (this.ids.has(invocationId)) return false;
    this.ids.add(invocationId);
    return true;
  }

  /** Gives the id back once its request is acknowledged. */
  release(invocationId: string): void {
    this.ids.delete(invocationId);
  }
}
