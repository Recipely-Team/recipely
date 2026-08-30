import { Platform } from 'react-native';
import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { appVersion } from '@presentation/base/utils/app-version';
import { CharConstants } from '@core/constants';
import { FailureReporter } from '@presentation/base/errors/failure-reporter';
import { getLocale } from '@presentation/i18n';
import { UnknownFailure } from '@core/failure';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useStores } from '@presentation/bootstrap/use-stores';

/** What the developers see in the feedback list, so these sort together. */
const REPORT_SUBJECT = 'Voice assistant report';
/** Separates the user's own words from the facts the app attached. */
const DIAGNOSTIC_RULE = '\n\n--- diagnostics ---\n';
const LINE_BREAK = '\n';
/** Where the crash report files this, next to the other `Assistant.*` contexts. */
const CRASH_CONTEXT = 'Assistant.reportProblem';
/** Said in place of the user's words when they only pointed at the failure. */
const NO_WORDS = 'Reported from the voice assistant.';
const NOTHING_FAILED = 'none';

/**
 * Lets the assistant send a problem report itself.
 *
 * @remarks
 * - **Why it exists.** A publish failed, the user said "bunu geliştiriciye
 *   bildir", and the assistant told them where the feedback form was. It was
 *   holding the failure, the screen and the user's own sentence at that moment;
 *   sending them to a form to retype all three is the app declining the one
 *   thing it was asked to do.
 * - **Two sinks, on purpose.** The user's words go to the feedback endpoint —
 *   the same one the Help & Feedback form posts to, which is what "tell the
 *   developer" means to the person saying it — and the same text is recorded
 *   as a non-fatal so it lands beside the crash it is about. Neither alone is
 *   the report: Crashlytics has no sentence, and the form has no stack.
 * - **The app attaches what the user cannot.** Version, platform, locale, the
 *   screen they are on and the last thing that failed. That block is the
 *   difference between a report someone can act on and "kaydedemedim".
 * - **Registered from the pill**, so it answers from every screen. A problem
 *   is reported from wherever it happened, and asking the user to navigate
 *   first is the behaviour this replaces.
 */
export const useAssistantReportActions = (): void => {
  const { assistantActionRegistry: registry, feedbackStore } = useStores();

  useAssistantAction(
    AssistantAction.ReportProblem,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const said = arg === undefined || arg === CharConstants.empty ? NO_WORDS : arg;
        // Read BEFORE the report below, which is itself a failure and would
        // otherwise be the last one — every report after the first would have
        // carried the previous report instead of the bug.
        const seen = FailureReporter.lastFailure ?? NOTHING_FAILED;
        const message = [
          said,
          DIAGNOSTIC_RULE,
          `app=${appVersion} platform=${Platform.OS} locale=${getLocale()}`,
          `screen=${registry.screenContext}`,
          `lastAction=${registry.lastFailure ?? NOTHING_FAILED}`,
          `lastFailure=${seen}`,
        ].join(LINE_BREAK);

        // Crashlytics as well as the form: it is local, it cannot fail in a way
        // that matters here, and a report the network then refuses is still
        // worth having on the crash list.
        FailureReporter.report(new UnknownFailure(message), CRASH_CONTEXT);

        const sent = await feedbackStore.getState().submit({
          subject: REPORT_SUBJECT,
          message,
        });
        return sent ? { ok: true } : { ok: false, error: 'report_not_sent' };
      },
      [registry, feedbackStore],
    ),
  );
};
