import type { Failure } from '@presentation/base/types';
import { FailureCode } from '@core/failure';
import { t } from '@presentation/i18n';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import type { IoniconName } from '@presentation/base/errors/ionicon-name';
import type { FailureContentKey } from '@presentation/base/errors/failure-content-key';
import type { FailureContent } from '@presentation/base/errors/failure-content';
import { MESSAGE_KEY_TO_CONTENT_KEY } from '@presentation/base/errors/message-key-to-content-key';

// WHY: user copy is ALWAYS selected from a stable machine key — never from the
// backend's raw `message` sentence, which may be unlocalised, a leaked internal
// detail, or an "HTTP 400" placeholder. Two tiers, most specific first:
//
//   1. `failure.messageKey` — the backend error-catalogue key. The only channel
//      that can separate two errors sharing one `code` (a refused prompt and an
//      unusable AI response are both `unprocessable`), so it wins when we have
//      dedicated copy for it.
//   2. `failure.code` — the coarse bucket set by the failure's class. The
//      fallback for an unrecognised key, for client-raised/transport failures
//      (no key at all), and for a backend older than the catalogue rollout.
//      Behaviour here is unchanged from before the key channel existed.
//
// Everything downstream (content, toast message, severity, icon) is derived from
// the SAME resolved content key, so a failure can never read as one thing and be
// coloured as another.
// Exhaustive by construction: `FailureCode` is a closed union, so a new code
// that arrives without copy here is a compile error rather than a silent
// fall-through to the "unknown" wording.
const CODE_TO_KEY: Record<FailureCode, FailureContentKey> = {
  [FailureCode.Network]: 'network',
  [FailureCode.Timeout]: 'timeout',
  [FailureCode.Server]: 'server',
  [FailureCode.NotFound]: 'notFound',
  [FailureCode.Unauthorized]: 'unauthorized',
  [FailureCode.Forbidden]: 'forbidden',
  [FailureCode.Conflict]: 'conflict',
  [FailureCode.RateLimit]: 'rateLimit',
  [FailureCode.Validation]: 'validation',
  [FailureCode.Cancelled]: 'cancelled',
  [FailureCode.Unknown]: 'unknown',
};

const KEY_TO_SEVERITY: Partial<Record<FailureContentKey, SeverityType>> = {
  notFound: SeverityType.Neutral,
  rateLimit: SeverityType.Warning,
  // Nothing is broken and nothing was refused — the user just has to wait, look
  // elsewhere, or start the step again. Danger red would overstate all of these.
  cancelled: SeverityType.Neutral,
  aiCooldown: SeverityType.Warning,
  codeCooldown: SeverityType.Warning,
  importBusy: SeverityType.Warning,
  importNoRecipeFound: SeverityType.Neutral,
  registrationExpired: SeverityType.Neutral,
  resetLinkInvalid: SeverityType.Warning,
  resetLinkExpired: SeverityType.Warning,
  resetLinkUsed: SeverityType.Warning,
  codeExpired: SeverityType.Warning,
};

const KEY_TO_ICON: Partial<Record<FailureContentKey, IoniconName>> = {
  network: 'cloud-offline-outline',
  timeout: 'time-outline',
  server: 'warning-outline',
  notFound: 'search-outline',
  unauthorized: 'lock-closed-outline',
  forbidden: 'lock-closed-outline',
  conflict: 'alert-circle-outline',
  rateLimit: 'hourglass-outline',
  validation: 'alert-circle-outline',
  cancelled: 'close-circle-outline',
  unknown: 'sad-outline',

  aiPromptRejected: 'alert-circle-outline',
  aiInvalidResponse: 'sparkles-outline',
  aiUpstreamFailed: 'sparkles-outline',
  aiCooldown: 'hourglass-outline',
  promptRequired: 'create-outline',
  refineInstructionRequired: 'chatbubble-ellipses-outline',

  importInvalidUrl: 'link-outline',
  importNotInstagram: 'logo-instagram',
  importFetchFailed: 'cloud-download-outline',
  importDurationExceeded: 'time-outline',
  importNoRecipeFound: 'search-outline',
  importBusy: 'hourglass-outline',
  recipeExists: 'copy-outline',

  emailExists: 'mail-outline',
  codeInvalid: 'keypad-outline',
  codeExpired: 'time-outline',
  codeAttemptsExceeded: 'lock-closed-outline',
  codeCooldown: 'hourglass-outline',
  registrationExpired: 'refresh-outline',

  invalidMediaType: 'images-outline',
  invalidImageType: 'image-outline',
  fileTooLarge: 'cloud-upload-outline',

  accountDeleted: 'person-remove-outline',
  resetLinkInvalid: 'link-outline',
  resetLinkExpired: 'time-outline',
  resetLinkUsed: 'checkmark-done-outline',
  passwordTooShort: 'key-outline',
};

const FALLBACK_ICON: IoniconName = 'sad-outline';

/** The dedicated content key for a failure's `messageKey`, if we have copy for it. */
const dedicatedKeyFor = (failure: Failure): FailureContentKey | undefined =>
  failure.messageKey === undefined ? undefined : MESSAGE_KEY_TO_CONTENT_KEY[failure.messageKey];

const keyFor = (failure: Failure): FailureContentKey =>
  dedicatedKeyFor(failure) ?? CODE_TO_KEY[failure.code] ?? 'unknown';

/** The semantic severity a failure should be rendered with (defaults to danger). */
export const failureSeverity = (failure: Failure): SeverityType =>
  KEY_TO_SEVERITY[keyFor(failure)] ?? 'danger';

/** Localized title + body for a full-screen or section error state. */
export const failureContent = (failure: Failure): FailureContent => {
  const entry = t().errors[keyFor(failure)];
  return { title: entry.title, body: entry.body };
};

/** Short, single-line message for a transient toast. */
export const failureToastMessage = (failure: Failure): string =>
  t().errors[keyFor(failure)].short;

/**
 * The short copy written specifically for this failure's `messageKey`, or
 * `undefined` when the failure carries no key or one we have no dedicated copy
 * for. Callers use it to decide whether the backend told them something precise
 * enough to say out loud — if it is `undefined`, they fall back to their own
 * screen-level copy (e.g. "rephrase your prompt") rather than the coarse bucket.
 */
export const failureKeyMessage = (failure: Failure): string | undefined => {
  const key = dedicatedKeyFor(failure);
  return key === undefined ? undefined : t().errors[key].short;
};

/** The illustration icon for a failure's full-screen / section state. */
export const failureIcon = (failure: Failure): IoniconName =>
  KEY_TO_ICON[keyFor(failure)] ?? FALLBACK_ICON;
