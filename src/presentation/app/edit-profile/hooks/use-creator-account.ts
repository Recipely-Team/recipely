import { useTranslations } from '@presentation/i18n';
import { useCallback, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { useFocusEffect } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import type { Failure } from '@core/failure';
import { CharConstants } from '@core/constants';
import { CreatorClaims } from '@domain/creators/creator-claims';
import { CreatorHandle } from '@domain/creators/creator-handle';
import { CreatorPlatform, type CreatorPlatformType } from '@domain/creators/creator-platform';
import { useStores } from '@presentation/bootstrap/use-stores';
import { failureKeyMessage, failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { CreatorAccountRowKind } from '@presentation/app/edit-profile/model/creator-account-row-kind';
import type { CreatorAccountRowType } from '@presentation/app/edit-profile/model/creator-account-row';
import type { UseCreatorAccountResult } from '@presentation/app/edit-profile/model/use-creator-account-result';

const PLATFORMS: readonly CreatorPlatformType[] = Object.values(CreatorPlatform);

/**
 * Orchestrates Edit Profile's creator section over the signed-in user's
 * claims, one per platform, each reviewed on its own.
 *
 * @remarks
 * - **Rows from the claims.** A claimed platform is a linked row, an unclaimed
 *   one a Link row — linked first; the one open form takes its platform's row.
 * - **A withdrawn handle is remembered**, so linking the platform again opens
 *   prefilled; an unlinked one is forgotten.
 * - **Re-reads the claims on every focus**, so an admin's decision shows the
 *   next time the user opens this page — but not while a send or remove is in
 *   flight; the auth store drops a refresh that one overtook.
 * - **One action at a time**, guarded by a ref: `isBusy` is render state and
 *   a second tap in the same frame still sees `false`.
 */
export const useCreatorAccount = (): UseCreatorAccountResult => {
  const t = useTranslations();
  const { authStore } = useStores();
  const stored = useStore(authStore, (s) => (s.state.status === StoreStatus.Authenticated ? s.state.session.user.creatorClaims : null));
  const claims = stored ?? CreatorClaims.empty();
  const requestCreatorTag = useStore(authStore, (s) => s.requestCreatorTag);
  const removeCreatorTag = useStore(authStore, (s) => s.removeCreatorTag);
  const refreshCreatorClaim = useStore(authStore, (s) => s.refreshCreatorClaim);

  const [formPlatform, setFormPlatform] = useState<CreatorPlatformType | null>(null);
  const [handle, setHandle] = useState<string>(CharConstants.empty);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<CreatorPlatformType, string>>>({});
  const [isBusy, setBusy] = useState(false);
  // The guard itself: render state lags a second tap in the same frame.
  const busyRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!busyRef.current) void refreshCreatorClaim();
    }, [refreshCreatorClaim]),
  );

  const run = async (action: () => Promise<Failure | null>, onFailure: (failure: Failure) => void): Promise<boolean> => {
    busyRef.current = true;
    setBusy(true);
    const failure = await action().finally(() => {
      busyRef.current = false;
      setBusy(false);
    });
    if (failure !== null) onFailure(failure);
    return failure === null;
  };

  const rowFor = (platform: CreatorPlatformType): CreatorAccountRowType => {
    if (platform === formPlatform) return { kind: CreatorAccountRowKind.Form, platform, handle, error };
    const claim = claims.forPlatform(platform);
    return claim === null ? { kind: CreatorAccountRowKind.Add, platform } : { kind: CreatorAccountRowKind.Linked, claim };
  };
  const linked = PLATFORMS.filter((platform) => claims.forPlatform(platform) !== null);
  const unlinked = PLATFORMS.filter((platform) => claims.forPlatform(platform) === null);

  return {
    rows: [...linked, ...unlinked].map(rowFor),
    isBusy,
    onOpenForm: (platform) => {
      setFormPlatform(platform);
      setHandle(claims.forPlatform(platform)?.tag.handle ?? drafts[platform] ?? CharConstants.empty);
      setError(null);
    },
    onChangeHandle: (value) => {
      setHandle(CreatorHandle.sanitizeInput(value));
      setError(null);
    },
    onSubmit: () => {
      if (busyRef.current || formPlatform === null) return;
      const input = { platform: formPlatform, handle: CreatorHandle.normalize(handle) };
      void run(
        () => requestCreatorTag(input),
        (failure) => setError(failureKeyMessage(t, failure) ?? failureToastMessage(t, failure)),
      ).then((wasSent) => {
        if (wasSent) setFormPlatform(null);
      });
    },
    onCancel: () => {
      setFormPlatform(null);
      setError(null);
    },
    onRemove: (platform) => {
      if (busyRef.current) return;
      const claim = claims.forPlatform(platform);
      void run(
        () => removeCreatorTag(platform),
        (failure) => void showErrorToast(failure),
      ).then((wasRemoved) => {
        if (!wasRemoved || claim === null) return;
        setDrafts((current) => ({ ...current, [platform]: claim.isPending ? claim.tag.handle : undefined }));
      });
    },
  };
};
