import { useCallback, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { InstagramUrl } from '@domain/recipes/import/instagram-url';
import { CharConstants, ValueConstants } from '@core/constants';
import type { Failure } from '@core/failure';

/** View model for the paste-a-link screen. */
interface UsePasteImportLinkResult {
  value: string;
  onChangeValue: (next: string) => void;
  /** Set when the field is simply empty — a nudge, not a failure worth a banner. */
  isEmpty: boolean;
  /** Set when the link is a real link but the wrong one. Rendered as a banner. */
  failure: Failure | null;
  /** Shown when the clipboard could not be read — the field is the fallback. */
  showManualHint: boolean;
  onPaste: () => void;
  onDismissFailure: () => void;
  /** Validates and hands back the URL to import, or null when it is not usable. */
  submit: () => string | null;
}

/**
 * Owns the paste field: what is in it, what is wrong with it, and the clipboard.
 *
 * @remarks
 * - **Validated here, before the network.** {@link InstagramUrl} is the same
 *   rule the use case applies, so the user is told that a profile link has no
 *   video behind it now rather than after a request.
 * - **Empty is not an error.** It gets a one-line nudge under the field; a
 *   banner for "you have not typed anything yet" reads as a system fault.
 * - **A clipboard read can be denied or empty**, on the web especially. Both
 *   paths end with the field focused and a hint, never with a button that
 *   silently did nothing.
 */
export const usePasteImportLink = (): UsePasteImportLinkResult => {
  const [value, setValue] = useState(CharConstants.empty);
  const [isEmpty, setIsEmpty] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [showManualHint, setShowManualHint] = useState(false);

  const onChangeValue = useCallback((next: string): void => {
    setValue(next);
    setIsEmpty(false);
    setFailure(null);
    setShowManualHint(false);
  }, []);

  const onPaste = useCallback((): void => {
    setShowManualHint(false);
    void (async () => {
      try {
        const text = await Clipboard.getStringAsync();
        if (text.trim().length === ValueConstants.zero) {
          setShowManualHint(true);
          return;
        }
        onChangeValue(text.trim());
      } catch {
        setShowManualHint(true);
      }
    })();
  }, [onChangeValue]);

  const submit = useCallback((): string | null => {
    setShowManualHint(false);
    if (value.trim().length === ValueConstants.zero) {
      setIsEmpty(true);
      setFailure(null);
      return null;
    }
    const url = InstagramUrl.create(value);
    if (!url.ok) {
      setIsEmpty(false);
      setFailure(url.failure);
      return null;
    }
    setFailure(null);
    return url.value.value;
  }, [value]);

  return {
    value,
    onChangeValue,
    isEmpty,
    failure,
    showManualHint,
    onPaste,
    onDismissFailure: () => setFailure(null),
    submit,
  };
};
