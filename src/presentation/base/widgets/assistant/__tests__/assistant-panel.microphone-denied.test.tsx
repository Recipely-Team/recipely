/**
 * The symptom: "canlıdaki ios versiyonda asistan mikrofon izni istemiyor bu
 * yüzden sesli olarak çalışmıyor."
 *
 * It did request it. **iOS shows that prompt exactly once, ever.** After the
 * first answer `requestRecordingPermissions()` returns "Denied" immediately and
 * draws nothing at all, so every later press produced the same sentence —
 * "Recipely needs the microphone to hear you." — with nothing to press. From
 * the user's seat that is indistinguishable from an app that never asks.
 *
 * The decision lives in Settings once iOS has stopped asking, so the notice has
 * to lead there. These are about the way out existing, not about its styling.
 */

/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

const mockSession = {
  status: 'unavailable',
  view: 'open',
  level: 0,
  isMuted: false,
  transcript: [],
  remainingSeconds: 0,
  isUnlimited: false,
  deniedReason: 'microphone_denied' as string | null,
  error: null as unknown,
  clearError: jest.fn(),
  setView: jest.fn(),
  toggleMute: jest.fn(),
  toggleVoice: jest.fn(),
  sendText: jest.fn(),
};

jest.mock('@presentation/base/hooks/assistant/use-assistant-session', () => ({
  useAssistantSession: () => mockSession,
}));

import { act } from 'react-test-renderer';
import { Linking } from 'react-native';
import { AssistantPanel } from '@presentation/base/widgets/assistant/views/assistant-panel';
import { AssistantStatus } from '@application/assistant/session/assistant-status';
import { AssistantView } from '@application/assistant/session/assistant-view';
import { AssistantDenialReason } from '@domain/assistant/session/assistant-denial-reason';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

const mounted: { unmount: () => void }[] = [];

const render = () => {
  const result = renderComponent(
    <AssistantPanel onClose={jest.fn()} onMinimize={jest.fn()} bottomOffset={0} />,
  );
  mounted.push(result.renderer);
  return result;
};

afterEach(() => {
  act(() => {
    while (mounted.length > 0) mounted.pop()?.unmount();
  });
  mockSession.status = AssistantStatus.Unavailable;
  mockSession.deniedReason = AssistantDenialReason.MicrophoneDenied;
  mockSession.error = null;
});

beforeEach(() => {
  mockSession.status = AssistantStatus.Unavailable;
  mockSession.view = AssistantView.Open;
  mockSession.deniedReason = AssistantDenialReason.MicrophoneDenied;
  mockSession.error = null;
});

const settingsControl = (root: { findAll: (m: (n: { props: Record<string, unknown> }) => boolean) => { props: Record<string, unknown> }[] }) =>
  root.findAll(
    (n) =>
      n.props['accessibilityLabel'] === t().common.openSettings &&
      typeof n.props['onPress'] === 'function',
  );

describe('AssistantPanel — a microphone iOS will not ask about again', () => {
  it('offers the way out, not just the sentence', () => {
    const { root } = render();

    expect(settingsControl(root)).toHaveLength(1);
  });

  it('opens Settings when it is pressed', () => {
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    const { root } = render();

    act(() => {
      (settingsControl(root)[0]?.props['onPress'] as () => void)();
    });

    expect(openSettings).toHaveBeenCalledTimes(1);
    openSettings.mockRestore();
  });

  // Settings cannot fix a daily limit or an unreachable backend, and a button
  // that goes somewhere useless is worse than no button.
  it.each([
    AssistantDenialReason.UserDailyLimit,
    AssistantDenialReason.GlobalDailyLimit,
    null,
  ])('offers nothing to open for %s', (reason) => {
    mockSession.deniedReason = reason;

    const { root } = render();

    expect(settingsControl(root)).toHaveLength(0);
  });

  it('offers nothing to open while voice is working', () => {
    mockSession.status = AssistantStatus.Listening;
    mockSession.deniedReason = null;

    const { root } = render();

    expect(settingsControl(root)).toHaveLength(0);
  });
});
