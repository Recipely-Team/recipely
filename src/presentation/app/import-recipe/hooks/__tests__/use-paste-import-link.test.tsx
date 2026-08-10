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

  /**
   * THE REGRESSION: the field showed `https://www.instagram.com/p/` and cut the
   * rest off, so the user could not tell whether the part that identifies the
   * post had come along — and went back to Instagram to copy it again.
   *
   * The field wraps now, and this is the other half: a positive confirmation
   * naming the link we understood, so "did I copy the right thing?" has an
   * answer on screen.
   */
  it('confirms the link it understood after a paste', async () => {
    getStringAsync.mockResolvedValue(REEL);
    const vm = drive();

    await act(async () => {
      vm().onPaste();
      await Promise.resolve();
    });

    // The identifying half, which is exactly what a truncated field hid.
    expect(vm().recognised).toBe('instagram.com/reel/Cx1y2z3');
  });

  it('confirms a link the user typed once they leave the field', () => {
    const vm = drive();
    act(() => vm().onChangeValue(REEL));

    act(() => vm().onBlur());

    expect(vm().recognised).toBe('instagram.com/reel/Cx1y2z3');
  });

  it('says nothing while the link is still being typed', () => {
    // Checking on every keystroke would shout "invalid" at someone halfway
    // through a URL. Confirmation belongs at the end of an action.
    const vm = drive();

    act(() => vm().onChangeValue('https://www.instagram.com/re'));

    expect(vm().recognised).toBeNull();
    expect(vm().failure).toBeNull();
  });

  it('withdraws the confirmation when the link is edited away', () => {
    const vm = drive();
    act(() => vm().onChangeValue(REEL));
    act(() => vm().onBlur());
    expect(vm().recognised).not.toBeNull();

    act(() => vm().onChangeValue('https://www.instagram.com/somechef/'));

    expect(vm().recognised).toBeNull();
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
