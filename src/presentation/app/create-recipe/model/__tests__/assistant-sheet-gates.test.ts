import { assistantSheetGates } from '@presentation/app/create-recipe/model/assistant-sheet-gates';

/**
 * Two bugs, one shape: a sheet folded into the gate that decides whether that
 * same sheet may be answered.
 *
 * First `goBack` was ungated, so "çık" said to the publish confirmation opened
 * the exit sheet underneath it — and the spoken "hayır", still read against
 * the publish sheet on top, discarded the draft. The fix for that put the
 * publish sheet into the value the publish sheet's own gate negates, which
 * made `publishOpen && !exitOrErrorOpen` unsatisfiable: the publish sheet
 * could not be answered out loud at all, in any state.
 */

const NONE = {
  exitOpen: false,
  publishOpen: false,
  saveErrorOpen: false,
  saveIssueOpen: false,
  photosOpen: false,
};

describe('assistantSheetGates', () => {
  it('lets the publish sheet be answered while it is the sheet on screen', () => {
    const gates = assistantSheetGates({ ...NONE, publishOpen: true });

    // The publish confirmation's own condition is `publishOpen && !exitOrErrorOpen`.
    expect(gates.exitOrErrorOpen).toBe(false);
  });

  it('lets the exit sheet be answered while it is the sheet on screen', () => {
    const gates = assistantSheetGates({ ...NONE, exitOpen: true });

    expect(gates.isExitPending).toBe(true);
  });

  it('does not offer to leave from behind another sheet', () => {
    expect(assistantSheetGates({ ...NONE, publishOpen: true }).canLeave).toBe(false);
    expect(assistantSheetGates({ ...NONE, photosOpen: true }).canLeave).toBe(false);
    expect(assistantSheetGates({ ...NONE, saveErrorOpen: true }).canLeave).toBe(false);
    expect(assistantSheetGates({ ...NONE, saveIssueOpen: true }).canLeave).toBe(false);
  });

  it('stops the exit sheet answering for a sheet drawn over it', () => {
    expect(assistantSheetGates({ ...NONE, exitOpen: true, publishOpen: true }).isExitPending).toBe(
      false,
    );
    expect(assistantSheetGates({ ...NONE, exitOpen: true, photosOpen: true }).isExitPending).toBe(
      false,
    );
  });

  it('takes the publish and refine confirmations off while the exit sheet is up', () => {
    expect(assistantSheetGates({ ...NONE, exitOpen: true }).exitOrErrorOpen).toBe(true);
  });

  it('takes them off behind an error dialog or the photo picker', () => {
    expect(assistantSheetGates({ ...NONE, saveErrorOpen: true }).exitOrErrorOpen).toBe(true);
    expect(assistantSheetGates({ ...NONE, saveIssueOpen: true }).exitOrErrorOpen).toBe(true);
    // `attachPhoto` can raise the picker over a pending publish confirm, and a
    // spoken "yes" would otherwise publish while the user looks at their library.
    expect(assistantSheetGates({ ...NONE, photosOpen: true }).exitOrErrorOpen).toBe(true);
  });

  it('offers everything when nothing is open', () => {
    const gates = assistantSheetGates(NONE);

    expect(gates).toEqual({ exitOrErrorOpen: false, canLeave: true, isExitPending: false });
  });
});
