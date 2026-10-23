/**
 * The symptom: while the assistant talked, the whole assistant dock re-rendered
 * on every waveform tick — the level is published up to every 80 ms, and the
 * pill, the panel and the transcript list all subscribed to it through
 * `useAssistantSession`, though only the wave bars and the orb draw it.
 *
 * Measured with React's `<Profiler>` against a real Zustand store: the level
 * moves 50 times and the test counts who rendered. Only the components that
 * draw the level may render on a tick.
 */

/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

const mockRenders = { pill: 0, transcript: 0, wave: 0 };

jest.mock('@presentation/base/hooks/assistant/actions/use-assistant-global-actions', () => ({
  // Called once per pill render, so it doubles as the pill's render counter.
  useAssistantGlobalActions: () => {
    mockRenders.pill += 1;
  },
}));
jest.mock('@presentation/base/hooks/assistant/actions/use-assistant-reach-actions', () => ({ useAssistantReachActions: () => undefined }));
jest.mock('@presentation/base/hooks/assistant/actions/use-assistant-report-actions', () => ({ useAssistantReportActions: () => undefined }));
jest.mock('@presentation/base/hooks/assistant/actions/use-assistant-timer-actions', () => ({ useAssistantTimerActions: () => undefined }));
jest.mock('@presentation/base/hooks/assistant/use-assistant-screen-context', () => ({ useAssistantScreenContext: () => undefined }));
jest.mock('@presentation/base/hooks/assistant/os/use-os-assistant-invocations', () => ({ useOsAssistantInvocations: () => undefined }));
jest.mock('@presentation/base/hooks/assistant/os/use-os-entity-catalogue-sync', () => ({ useOsEntityCatalogueSync: () => undefined }));
jest.mock('@presentation/base/hooks/assistant/os/use-os-assistant-credentials', () => ({ useOsAssistantCredentials: () => undefined }));
jest.mock('@presentation/base/hooks/assistant/use-assistant-is-offered', () => ({ useAssistantIsOffered: () => true }));
jest.mock('@presentation/base/hooks/assistant/use-assistant-floating-clearance', () => ({ useAssistantFloatingClearance: () => 0 }));
jest.mock('@presentation/base/hooks/interaction/use-keyboard-height', () => ({ useKeyboardHeight: () => 0 }));
jest.mock('@presentation/navigation/use-tab-bar-state', () => ({ useTabBarState: () => null }));
jest.mock('@presentation/base/widgets/assistant/parts/assistant-transcript', () => {
  const actual = jest.requireActual('@presentation/base/widgets/assistant/parts/assistant-transcript');
  return {
    AssistantTranscript: (props: object) => {
      mockRenders.transcript += 1;
      return actual.AssistantTranscript(props);
    },
  };
});
jest.mock('@presentation/base/widgets/assistant/parts/assistant-wave', () => {
  const actual = jest.requireActual('@presentation/base/widgets/assistant/parts/assistant-wave');
  return {
    AssistantWave: (props: object) => {
      mockRenders.wave += 1;
      return actual.AssistantWave(props);
    },
  };
});

import { Profiler } from 'react';
import { act } from 'react-test-renderer';
import { create } from 'zustand';
import { AssistantPill } from '@presentation/base/widgets/assistant/assistant-pill';
import { LayoutContext } from '@presentation/base/responsive/layout-context';
import type { LayoutContextValue } from '@presentation/base/responsive/layout-context-value';
import { OrientationType } from '@presentation/base/responsive/orientation-type';
import { AssistantStatus } from '@application/assistant/session/assistant-status';
import { AssistantView, type AssistantViewType } from '@application/assistant/session/assistant-view';
import { AssistantTranscriptLineKind } from '@application/assistant/session/assistant-transcript-line-kind';
import type { AssistantSessionStore } from '@application/assistant/session/assistant-session-store-contract';
import type { AssistantTranscriptLineType } from '@application/assistant/session/assistant-transcript-line';
import type { ApplicationStores } from '@application/di/application-stores';
import { ChatRole } from '@domain/drafts/chat-role';
import { renderComponent } from '@presentation/base/test-support/render-component';

const TICKS = 50;
const LINES = 30;

const layout = (isExpanded: boolean): LayoutContextValue => ({
  width: isExpanded ? 1280 : 390,
  height: 800,
  aspectRatio: 1,
  orientation: OrientationType.Portrait,
  breakpoint: isExpanded ? 'desktop' : 'mobile',
  isWebShell: false,
  isExpanded,
  isCompact: !isExpanded,
  fold: null,
} as LayoutContextValue);

const transcript: AssistantTranscriptLineType[] = Array.from({ length: LINES }, (_, at) => ({
  kind: AssistantTranscriptLineKind.Speech,
  id: `line-${at}`,
  speaker: at % 2 === 0 ? ChatRole.User : ChatRole.Assistant,
  text: `Line ${at} of a conversation long enough to scroll.`,
}));

const sessionStore = (view: AssistantViewType) =>
  create<AssistantSessionStore>(() => ({
    session: { status: AssistantStatus.Speaking },
    view,
    level: 0,
    isMuted: false,
    transcript,
    remainingSeconds: 600,
    isUnlimited: false,
    tokensUsed: 0,
    error: null,
    setView: jest.fn(),
    toggleMute: jest.fn(),
    startVoice: jest.fn(),
    stopVoice: jest.fn(),
    sendText: jest.fn(),
    clearError: jest.fn(),
    reset: jest.fn(),
  }) as unknown as AssistantSessionStore);

/** Mounts the pill, moves the level `TICKS` times, and reports what each tick cost. */
const measureTicks = (isExpanded: boolean, view: AssistantViewType) => {
  const store = sessionStore(view);
  let tickDuration = 0;
  let measuring = false;
  renderComponent(
    <LayoutContext.Provider value={layout(isExpanded)}>
      <Profiler
        id="assistant"
        onRender={(_id, _phase, actualDuration) => {
          if (measuring) tickDuration += actualDuration;
        }}
      >
        <AssistantPill />
      </Profiler>
    </LayoutContext.Provider>,
    { assistantSessionStore: store } as unknown as Partial<ApplicationStores>,
  );

  mockRenders.pill = 0;
  mockRenders.transcript = 0;
  mockRenders.wave = 0;
  measuring = true;
  for (let tick = 1; tick <= TICKS; tick += 1) {
    act(() => store.setState({ level: (tick % 10) / 10 }));
  }
  measuring = false;

  const result = { ...mockRenders, tickDuration };
  if (process.env['PROFILE_RENDERS'] === '1') {
    process.stdout.write(
      `[profile] ${isExpanded ? 'wide' : 'phone'}/${view} ${TICKS} ticks: pill=${result.pill} transcript=${result.transcript} wave=${result.wave} actualDuration=${tickDuration.toFixed(1)}ms\n`,
    );
  }
  return result;
};

describe('assistant level ticks re-render only what draws the level', () => {
  it('phone, open orb: the pill and the transcript stay put; the orb wave follows the level', () => {
    const result = measureTicks(false, AssistantView.Open);
    expect(result.pill).toBe(0);
    expect(result.transcript).toBe(0);
    expect(result.wave).toBeGreaterThan(0);
  });

  it('wide, open panel: the pill and the transcript stay put; the voice-stage wave follows the level', () => {
    const result = measureTicks(true, AssistantView.Open);
    expect(result.pill).toBe(0);
    expect(result.transcript).toBe(0);
    expect(result.wave).toBeGreaterThan(0);
  });

  it('wide, mini bar: the pill stays put; the mini-bar wave follows the level', () => {
    const result = measureTicks(true, AssistantView.Mini);
    expect(result.pill).toBe(0);
    expect(result.wave).toBeGreaterThan(0);
  });
});
