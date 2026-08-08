/**
 * The paste field: what it accepts, what it says when it does not, and the
 * clipboard button that must never silently do nothing.
 *
 * The distinction under test is between EMPTY and WRONG. "You have not typed
 * anything yet" is a nudge; "this link has no video behind it" is a finding.
 * Rendering the first as a banner reads as a system fault, which is why they
 * are separate fields on the view model rather than one `error`.
 */

import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { usePasteImportLink } from '@presentation/app/import-recipe/hooks/use-paste-import-link';
import { ErrorMessageKey } from '@core/failure';
import * as Clipboard from 'expo-clipboard';

jest.mock('expo-clipboard', () => ({ getStringAsync: jest.fn() }));

const getStringAsync = Clipboard.getStringAsync as jest.MockedFunction<typeof Clipboard.getStringAsync>;

const REEL = 'https://www.instagram.com/reel/Cx1y2z3/';

type ViewModel = ReturnType<typeof usePasteImportLink>;

const drive = () => {
  let latest!: ViewModel;
  const Probe = (): null => {
    latest = usePasteImportLink();
    return null;
  };
  renderComponent(<Probe />);
  return () => latest;
};

describe('usePasteImportLink', () => {
  beforeEach(() => {
    getStringAsync.mockReset();
  });

  it('hands back the link when it is a real post URL', () => {
    const vm = drive();
    act(() => vm().onChangeValue(REEL));

    let submitted: string | null = null;
    act(() => {
      submitted = vm().submit();
    });

    expect(submitted).toBe(REEL);
    expect(vm().failure).toBeNull();
  });

  it('nudges rather than alarms when the field is empty', () => {
    const vm = drive();

    let submitted: string | null = REEL;
    act(() => {
      submitted = vm().submit();
    });

    expect(submitted).toBeNull();
    expect(vm().isEmpty).toBe(true);
    // No banner: the user has not done anything wrong yet.
    expect(vm().failure).toBeNull();
  });

  it('explains a wrong link through the same failure the backend would have sent', () => {
    const vm = drive();
    act(() => vm().onChangeValue('https://www.tiktok.com/@chef/video/1'));

    act(() => {
      vm().submit();
    });

    expect(vm().failure?.messageKey).toBe(ErrorMessageKey.importNotInstagram);
    expect(vm().isEmpty).toBe(false);
  });

  it('clears the complaint as soon as the user edits the field', () => {
    const vm = drive();
    act(() => vm().onChangeValue('https://www.instagram.com/somechef/'));
    act(() => {
      vm().submit();
    });
    expect(vm().failure).not.toBeNull();

    act(() => vm().onChangeValue(REEL));

    // Editing IS the fix, so the old message must not sit under the new value.
    expect(vm().failure).toBeNull();
  });

  it('fills the field from the clipboard', async () => {
    getStringAsync.mockResolvedValue(`  ${REEL}  `);
    const vm = drive();

    await act(async () => {
      vm().onPaste();
      await Promise.resolve();
    });

    expect(vm().value).toBe(REEL);
  });

  it('tells the user to paste by hand when the clipboard is denied', async () => {
    // Reads are refused in plenty of contexts, and the web denies them outright
    // without a gesture. A button that appears to do nothing is the worst answer.
    getStringAsync.mockRejectedValue(new Error('denied'));
    const vm = drive();

    await act(async () => {
      vm().onPaste();
      await Promise.resolve();
    });

    expect(vm().showManualHint).toBe(true);
  });

  it('says the same when the clipboard is simply empty', async () => {
    getStringAsync.mockResolvedValue('   ');
    const vm = drive();

    await act(async () => {
      vm().onPaste();
      await Promise.resolve();
    });

    expect(vm().showManualHint).toBe(true);
    expect(vm().value).toBe('');
  });
});
