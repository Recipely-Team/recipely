import type { RequestMapper } from '@core/mapper/request-mapper';
import { DEFAULT_FEEDBACK_CATEGORY } from '@domain/feedback/feedback-category';
import type { FeedbackSubmission } from '@domain/feedback/feedback-submission';
import type { FeedbackRequestDto } from '@infrastructure/feedback/feedback-dto';
import { CharConstants } from '@core/constants';

/**
 * Maps a `FeedbackSubmission` (use-case input) to the `FeedbackRequestDto`
 * expected by `POST /feedback`. Always sets the fixed default category.
 * Omits `subject` entirely when it is blank after trimming so the backend
 * can distinguish "not provided" from an empty string.
 */
export const toFeedbackRequestDto: RequestMapper<FeedbackSubmission, FeedbackRequestDto> = (
  input,
) => {
  const trimmedSubject = input.subject.trim();
  const dto: FeedbackRequestDto = {
    category: DEFAULT_FEEDBACK_CATEGORY,
    message: input.message,
  };
  if (trimmedSubject !== CharConstants.empty) {
    dto.subject = trimmedSubject;
  }
  return dto;
};
