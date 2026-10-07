/**
 * The feed's one-time reminders opt-in: shown only when the use case says so, held back while
 * another sheet is up, and any answer, yes or dismissal, is stored through `setRemindersChoice`.
 */
import { act } from 'react-test-renderer';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { ApplicationStores } from '@application/di/application-stores';
import type { ConfirmSheetProps } from '@presentation/base/widgets/sheets/confirm-sheet';
import { renderComponent } from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { RemindersOfferSheet } from '@presentation/app/recipes/sheets/reminders-offer-sheet';
import { t } from '@presentation/i18n';

let sheet: ConfirmSheetProps | null = null;

jest.mock('@presentation/base/widgets/sheets/confirm-sheet', () => ({
  ConfirmSheet: (props: ConfirmSheetProps) => {
    sheet = props;
    return null;
  },
}));

const shouldOfferReminders = { execute: jest.fn(() => Promise.resolve(true)) };
const setRemindersChoice = { execute: jest.fn(() => Promise.resolve(true)) };
const mounted: RenderResult[] = [];

const renderOffer = async (blocked = false): Promise<RenderResult> => {
  const stores = { shouldOfferReminders, setRemindersChoice } as unknown as ApplicationStores;
  const rendered = renderComponent(
    <StoresProvider value={stores}>
      <RemindersOfferSheet blocked={blocked} />
    </StoresProvider>,
  );
  mounted.push(rendered);
  await act(async () => {});
  return rendered;
};

beforeEach(() => {
  sheet = null;
  shouldOfferReminders.execute.mockClear();
  setRemindersChoice.execute.mockClear();
});

afterEach(() => {
  act(() => {
    for (const r of mounted.splice(0)) r.renderer.unmount();
  });
});

describe('RemindersOfferSheet', () => {
  it('asks on a return visit, with "Not now" as the way out', async () => {
    await renderOffer();
    expect(sheet?.visible).toBe(true);
    expect(sheet?.title).toBe(t().reminders.offerTitle);
    expect(sheet?.cancelLabel).toBe(t().reminders.offerDecline);
  });

  it('stays hidden when the use case says not yet', async () => {
    shouldOfferReminders.execute.mockImplementationOnce(() => Promise.resolve(false));
    await renderOffer();
    expect(sheet?.visible).toBe(false);
  });

  it('waits while another sheet owns the screen', async () => {
    await renderOffer(true);
    expect(sheet?.visible).toBe(false);
  });

  it('stores a yes and closes', async () => {
    await renderOffer();
    await act(async () => sheet?.onConfirm());
    expect(setRemindersChoice.execute).toHaveBeenCalledWith(true, t().reminders.messages, expect.any(Number));
    expect(sheet?.visible).toBe(false);
  });

  it('stores a dismissal as a no, so it is never asked again', async () => {
    await renderOffer();
    await act(async () => sheet?.onClose());
    expect(setRemindersChoice.execute).toHaveBeenCalledWith(false, t().reminders.messages, expect.any(Number));
    expect(sheet?.visible).toBe(false);
  });
});
