import { StyleSheet } from 'react-native';
import { isString } from '@core/guards/type-guards';
import { useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@presentation/base/widgets/layout/screen-container';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import {
  failureContent,
  failureIcon,
  failureSeverity,
} from '@presentation/base/errors/failure-lookups';
import { useReportFailure } from '@presentation/base/errors/use-report-failure';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { useImportRecipe } from '@presentation/app/import-recipe/hooks/use-import-recipe';
import { ImportPasteView } from '@presentation/app/import-recipe/body/import-paste-view';
import { ImportQueueView } from '@presentation/app/import-recipe/body/import-queue-view';
import { CharConstants, ValueConstants } from '@core/constants';
import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { useAssistantAction } from '@presentation/base/hooks/assistant/use-assistant-action';

/**
 * The Instagram import, in its two states.
 *
 * @remarks
 * - **One route, because it is one thing.** Arriving with `?importUrl=` (a
 *   share intent) queues straight away; arriving without one asks for a link.
 *   Two routes would have meant two places that know what an import is, and a
 *   share that could land on the wrong one.
 * - **The paste path is what makes this work everywhere.** The share sheet is
 *   Android-only today and never exists on the web; a link and a field do.
 */
export const ImportRecipeScreen = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const params = useLocalSearchParams<{ importUrl?: string }>();
  const importUrl = isString(params.importUrl) ? params.importUrl : undefined;
  const vm = useImportRecipe(importUrl);

  // Importing takes a link, and a link is the one thing nobody dictates out
  // loud — it arrives from a share sheet. So the assistant's job here is to
  // submit what was shared and to open the draft when it is ready, not to
  // transcribe a URL.
  useAssistantAction(
    AssistantAction.ImportRecipe,
    useCallback(
      async (arg?: string) => {
        const url = arg ?? importUrl ?? CharConstants.empty;
        if (url === CharConstants.empty) return { ok: false, error: 'no_link' };
        vm.onSubmitLink(url);
        return { ok: true };
      },
      [vm, importUrl],
    ),
  );
  useAssistantAction(
    AssistantAction.OpenDraft,
    useCallback(async () => {
      vm.onOpenDraft();
      return { ok: true };
    }, [vm]),
  );
  const copy = t().importRecipe;

  useReportFailure(vm.failure, 'ImportRecipeScreen');

  if (vm.failure !== null) {
    const content = failureContent(vm.failure);
    return (
      <ScreenContainer scrollable={false}>
        <ErrorState
          severity={failureSeverity(vm.failure)}
          icon={failureIcon(vm.failure)}
          title={copy.failTitle}
          body={content.body}
          primaryLabel={t().common.retry}
          onPrimary={vm.onRetry}
          secondaryLabel={t().common.cancel}
          onSecondary={vm.onClose}
        />
      </ScreenContainer>
    );
  }

  return (
    <KeyboardAvoider style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenContainer scrollable={false} padded={false}>
        <ResponsiveContainer route="importRecipe" gutter={false} fill>
          {vm.isAwaitingLink ? (
            <ImportPasteView onSubmit={vm.onSubmitLink} onCancel={vm.onClose} />
          ) : (
            <ImportQueueView
              jobStatus={vm.jobStatus}
              activeStage={vm.activeStage}
              progress={vm.progress}
              isDone={vm.isDone}
              queuePosition={vm.queuePosition}
              isQueueing={vm.isQueueing}
              onPrimary={vm.isDone ? vm.onOpenDraft : vm.onNotifyMe}
            />
          )}
        </ResponsiveContainer>
      </ScreenContainer>
    </KeyboardAvoider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
  },
});

export default ImportRecipeScreen;
