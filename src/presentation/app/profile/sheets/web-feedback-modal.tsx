import { useState } from 'react';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { WebFeedbackForm } from '@presentation/app/profile/sheets/web-feedback-form';
import { WebFeedbackSuccess } from '@presentation/app/profile/sheets/web-feedback-success';
import { useStores } from '@presentation/bootstrap/use-stores';
import { layoutSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
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
  const { feedbackStore } = useStores();
  const submit = feedbackStore((s) => s.submit);
  const isSubmitting = feedbackStore((s) => s.isSubmitting);
  const error = feedbackStore((s) => s.error);
  const reset = feedbackStore((s) => s.reset);

  const [subject, setSubject] = useState(CharConstants.empty);
  const [message, setMessage] = useState(CharConstants.empty);
  const [sent, setSent] = useState(false);

  // UI deliberately requires `subject` too, even though the domain treats it as
  // optional — keep both guards in sync if this is ever loosened.
  const canSend = subject.trim().length > ValueConstants.zero && message.trim().length > ValueConstants.zero;

  const handleSend = async (): Promise<void> => {
    const ok = await submit({ subject, message });
    if (ok) setSent(true);
  };

  const handleClose = (): void => {
    reset();
    setSubject(CharConstants.empty);
    setMessage(CharConstants.empty);
    setSent(false);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      title={t().support.sheetTitle}
      onClose={handleClose}
      showCloseButton
      dialogMaxWidth={layoutSizes.webModalMaxWidth}
      footer={
        sent ? (
          <PrimaryButton label={t().support.sentDone} onPress={handleClose} />
        ) : (
          <PrimaryButton
            label={t().support.send}
            onPress={() => void handleSend()}
            disabled={!canSend}
            loading={isSubmitting}
          />
        )
      }
    >
      {sent ? (
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
