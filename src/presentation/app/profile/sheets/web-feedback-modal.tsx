import { useState } from 'react';
import { useStore } from 'zustand';
import type { Failure } from '@core/failure';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { WebFeedbackForm } from '@presentation/app/profile/sheets/web-feedback-form';
import { WebFeedbackSuccess } from '@presentation/app/profile/sheets/web-feedback-success';
import { useStores } from '@presentation/bootstrap/use-stores';
import { layoutSizes } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface WebFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Centered web-only feedback dialog (mobile uses FeedbackSheet instead).
 * Thin state-router: renders WebFeedbackForm until the message is sent, then
 * swaps to WebFeedbackSuccess.
 */
export const WebFeedbackModal = ({ visible, onClose }: WebFeedbackModalProps): React.JSX.Element => {
  const t = useTranslations();
  const { feedbackStore } = useStores();
  const submit = useStore(feedbackStore, (s) => s.submit);
  const isSubmitting = useStore(feedbackStore, (s) => s.isSubmitting);

  const [subject, setSubject] = useState(CharConstants.empty);
  const [message, setMessage] = useState(CharConstants.empty);
  const [wasSent, setSent] = useState(false);
  // This sheet's own failure; another submitter's never shows here.
  const [error, setError] = useState<Failure | null>(null);

  // The UI requires a subject although the domain allows none.
  const canSend = subject.trim().length > ValueConstants.zero && message.trim().length > ValueConstants.zero;

  const handleSend = async (): Promise<void> => {
    const failure = await submit({ subject, message });
    setError(failure);
    if (failure === null) setSent(true);
  };

  const handleClose = (): void => {
    setError(null);
    setSubject(CharConstants.empty);
    setMessage(CharConstants.empty);
    setSent(false);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      title={t.support.sheetTitle}
      onClose={handleClose}
      showCloseButton
      dialogMaxWidth={layoutSizes.webModalMaxWidth}
      footer={
        wasSent ? (
          <PrimaryButton label={t.support.sentDone} onPress={handleClose} />
        ) : (
          <PrimaryButton
            label={t.support.send}
            onPress={() => void handleSend()}
            disabled={!canSend}
            loading={isSubmitting}
          />
        )
      }
    >
      {wasSent ? (
        <WebFeedbackSuccess />
      ) : (
        <WebFeedbackForm
          subject={subject}
          message={message}
          onChangeSubject={setSubject}
          onChangeMessage={setMessage}
          showError={error !== null}
        />
      )}
    </BottomSheet>
  );
};
